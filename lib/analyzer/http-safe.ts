import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import type { IncomingHttpHeaders } from "node:http";
import type { RequestOptions } from "node:https";
import { resolveAndGuardHost, validateTargetUrl } from "./safety";

/* ═════════════════════════════════════════════════════════════════
   Cliente HTTP de salida del motor de análisis.

   Por qué no se usa `fetch` directamente:
   - `fetch` vuelve a resolver DNS en cada conexión y no permite fijar
     la IP ya validada (riesgo de DNS rebinding).
   - `redirect: "follow"` seguiría redirecciones sin revalidar el destino.
   - No impone un tope de bytes descomprimidos (riesgo de bomba gzip).

   Este cliente:
   1) valida sintácticamente cada URL y cada redirección;
   2) resuelve DNS y exige que TODAS las IP sean públicas;
   3) conecta a la IP validada, manteniendo el Host y el SNI originales;
   4) sigue redirecciones manualmente, revalidando y re-resolviendo cada salto;
   5) bloquea el downgrade HTTPS → HTTP;
   6) limita tiempo total, bytes crudos y bytes descomprimidos;
   7) no envía cookies ni credenciales del usuario.
   ═════════════════════════════════════════════════════════════════ */

export type SafeHttpCode =
  | "URL_INVALIDA"
  | "PROTOCOLO_NO_PERMITIDO"
  | "DESTINO_NO_SEGURO"
  | "SITIO_INACCESIBLE"
  | "DESCONECTADO"
  | "ERROR_INTERNO";

export interface SafeFetchOptions {
  url: string;
  userAgent: string;
  accept?: string;
  method?: "GET" | "HEAD";
  timeoutMs?: number;
  maxBodyBytes?: number;
  maxRedirects?: number;
}

export interface SafeHttpSuccess {
  ok: true;
  status: number;
  statusText: string;
  /** Cabeceras normalizadas a minúsculas; `set-cookie` se expone aparte. */
  headers: Map<string, string>;
  setCookies: string[];
  contentType: string | null;
  /** Cuerpo ya descomprimido y decodificado a texto. */
  body: string;
  /** Bytes descomprimidos efectivamente leídos. */
  bodyBytes: number;
  truncated: boolean;
  finalUrl: URL;
  /** Hosts visitados por redirecciones (sin repetir). */
  redirects: string[];
  /** IPs públicas distintas validadas durante la cadena (cantidad, no detalle). */
  validatedAddresses: number;
  durationMs: number;
}

export interface SafeHttpFailure {
  ok: false;
  code: SafeHttpCode;
  message: string;
  hint: string;
}

export type SafeHttpResult = SafeHttpSuccess | SafeHttpFailure;

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const MAX_RAW_BYTES = 2_000_000;

function fail(code: SafeHttpCode, message: string, hint: string): SafeHttpFailure {
  return { ok: false, code, message, hint };
}

function stripBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

function headerMap(headers: IncomingHttpHeaders): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(headers)) {
    if (key === "set-cookie" || value === undefined) continue;
    map.set(key, Array.isArray(value) ? value.join(", ") : String(value));
  }
  return map;
}

function setCookieList(headers: IncomingHttpHeaders): string[] {
  const raw = headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function decodeBody(buffer: Buffer, contentType: string | null): string {
  const charset = /charset\s*=\s*"?([^";\s]+)/i.exec(contentType ?? "")?.[1]?.toLowerCase();
  try {
    return new TextDecoder(charset || "utf-8", { fatal: false }).decode(buffer);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  }
}

interface Collected {
  buffer: Buffer;
  bytes: number;
  truncated: boolean;
}

function collectCapped(stream: NodeJS.ReadableStream, cap: number): Promise<Collected> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    const finish = (truncated: boolean) => {
      if (settled) return;
      settled = true;
      resolve({
        buffer: Buffer.concat(chunks),
        bytes: truncated ? cap : total,
        truncated,
      });
    };

    stream.on("data", (chunk: Buffer | string) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > cap) {
        const allowed = buf.subarray(0, Math.max(0, cap - (total - buf.length)));
        if (allowed.length > 0) chunks.push(allowed);
        finish(true);
        // No se necesita seguir descargando: se cierra el socket.
        const destroyable = stream as unknown as { destroy?: () => void };
        if (typeof destroyable.destroy === "function") destroyable.destroy();
        return;
      }
      chunks.push(buf);
    });

    stream.on("end", () => finish(false));
    stream.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

interface HopResponse {
  status: number;
  statusText: string;
  headers: IncomingHttpHeaders;
  body: string;
  bodyBytes: number;
  truncated: boolean;
}

function requestHop(
  url: URL,
  address: string,
  family: number,
  timeoutMs: number,
  maxBodyBytes: number,
  options: SafeFetchOptions,
): Promise<HopResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const succeed = (value: HopResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      resolve(value);
    };
    const failWith = (err: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      reject(err);
    };

    const targetHost = stripBrackets(url.hostname);
    const isIpLiteral = net.isIP(targetHost) !== 0;
    const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
    const headers: Record<string, string> = {
      host: url.host,
      "user-agent": options.userAgent,
      accept: options.accept ?? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      "accept-encoding": "identity",
      connection: "close",
    };

    const requestOptions: RequestOptions = {
      protocol: url.protocol,
      // Se conecta a la IP YA validada. El hostname original se conserva en
      // Host y SNI, de modo que los certificados y los virtual hosts funcionan.
      hostname: isIpLiteral ? targetHost : address,
      family,
      port,
      path: `${url.pathname}${url.search}`,
      method: options.method ?? "GET",
      headers,
      timeout: timeoutMs,
      maxHeaderSize: 32 * 1024,
      servername: url.protocol === "https:" && !isIpLiteral ? targetHost : undefined,
      rejectUnauthorized: true,
    };

    // Límite duro de tiempo total: cubre también respuestas que gotean bytes
    // lentamente y que `socket.setTimeout` no detectaría.
    const hardTimer = setTimeout(() => {
      req.destroy(Object.assign(new Error("TIMEOUT"), { code: "ETIMEDOUT" }));
    }, timeoutMs);

    const req = (url.protocol === "https:" ? https : http).request(requestOptions, (res) => {
      const status = res.statusCode ?? 0;
      const resHeaders = res.headers;
      const encoding = String(resHeaders["content-encoding"] ?? "").toLowerCase().trim();

      const finish = (collected: Collected) => {
        const contentType = resHeaders["content-type"] ? String(resHeaders["content-type"]) : null;
        succeed({
          status,
          statusText: res.statusMessage ?? "",
          headers: resHeaders,
          body: decodeBody(collected.buffer, contentType),
          bodyBytes: collected.bytes,
          truncated: collected.truncated,
        });
      };

      if ((options.method ?? "GET") === "HEAD" || status === 204 || status === 304) {
        res.resume();
        finish({ buffer: Buffer.alloc(0), bytes: 0, truncated: false });
        return;
      }

      if (!encoding || encoding === "identity") {
        collectCapped(res, maxBodyBytes).then(finish).catch(failWith);
        return;
      }

      let decoder: NodeJS.ReadWriteStream;
      if (encoding === "gzip" || encoding === "x-gzip" || encoding === "deflate") {
        decoder = zlib.createUnzip();
      } else if (encoding === "br") {
        decoder = zlib.createBrotliDecompress();
      } else {
        res.destroy();
        failWith(new Error("CODIFICACION_NO_SOPORTADA"));
        return;
      }

      decoder.on("error", failWith);
      res.on("error", failWith);
      res.pipe(decoder);
      collectCapped(decoder, maxBodyBytes).then(finish).catch(failWith);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(Object.assign(new Error("TIMEOUT"), { code: "ETIMEDOUT" }));
    });
    req.on("error", failWith);
    req.end();
  });
}

function mapNetworkError(err: unknown): SafeHttpFailure {
  const code = (err as { code?: string }).code ?? "";
  const name = (err as { name?: string }).name ?? "";
  if (code === "ETIMEDOUT" || name === "AbortError") {
    return fail(
      "DESCONECTADO",
      "El destino no respondió dentro del tiempo límite.",
      "El servidor tardó demasiado en responder; inténtalo nuevamente más tarde.",
    );
  }
  if (
    code.startsWith("CERT_") ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  ) {
    return fail(
      "SITIO_INACCESIBLE",
      "El certificado HTTPS del sitio no es válido o no coincide con el dominio.",
      "El análisis se detuvo porque no se pudo verificar la identidad del servidor.",
    );
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return fail("SITIO_INACCESIBLE", "No se pudo resolver el dominio del sitio.", "Verifica que el dominio exista y esté bien escrito.");
  }
  return fail(
    "SITIO_INACCESIBLE",
    "No se pudo conectar con el sitio (inaccesible o rechazó la conexión).",
    "Verifica la dirección, o contacta al administrador del sitio si es propio.",
  );
}

/**
 * Descarga una URL pública con protecciones SSRF y límites de recursos.
 * No lanza por fallos de red o validación: devuelve un resultado tipado.
 */
export async function safeFetch(options: SafeFetchOptions): Promise<SafeHttpResult> {
  const timeoutMs = Math.max(1500, Math.min(options.timeoutMs ?? 8000, 30_000));
  const maxBodyBytes = Math.max(1024, Math.min(options.maxBodyBytes ?? 512_000, MAX_RAW_BYTES));
  const maxRedirects = Math.max(0, Math.min(options.maxRedirects ?? 3, 5));
  const started = Date.now();
  const deadline = started + timeoutMs;

  let current: URL;
  const initial = validateTargetUrl(options.url);
  if (!initial.ok) return fail(initial.code, initial.reason, "Revisa la dirección e inténtalo nuevamente.");
  current = initial.url;

  const redirectHosts: string[] = [];
  const addresses = new Set<string>();

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return fail("DESCONECTADO", "El destino no respondió dentro del tiempo límite.", "Inténtalo nuevamente más tarde.");
    }

    const guard = await resolveAndGuardHost(current.hostname);
    if (!guard.ok) {
      return fail(guard.code, guard.reason, "El análisis se detuvo por seguridad; no se consultó el destino.");
    }
    for (const ip of guard.ips) addresses.add(ip);

    const address = guard.ips[0];
    const family = net.isIP(stripBrackets(address));

    let response: HopResponse;
    try {
      response = await requestHop(current, address, family, remaining, maxBodyBytes, options);
    } catch (err) {
      if ((err as Error).message === "CODIFICACION_NO_SOPORTADA") {
        return fail(
          "SITIO_INACCESIBLE",
          "El sitio respondió con una codificación de contenido no soportada.",
          "No se decompresiónó el cuerpo por seguridad. Inténtalo con otra URL del mismo sitio.",
        );
      }
      return mapNetworkError(err);
    }

    const location = response.headers.location;
    if (REDIRECT_STATUS.has(response.status) && location) {
      if (hop >= maxRedirects) {
        return fail(
          "SITIO_INACCESIBLE",
          "El sitio encadenó demasiadas redirecciones.",
          "Se detuvo el análisis para evitar bucles. Verifica la dirección final del sitio.",
        );
      }

      let next: URL;
      try {
        next = new URL(Array.isArray(location) ? location[0] : location, current);
      } catch {
        return fail("DESTINO_NO_SEGURO", "El sitio envió una redirección con una dirección inválida.", "El análisis se detuvo.");
      }

      const nextGuard = validateTargetUrl(next.toString());
      if (!nextGuard.ok) {
        return fail(
          "DESTINO_NO_SEGURO",
          `Redirección hacia un destino no permitido: ${nextGuard.reason}`,
          "El análisis se detuvo por seguridad; no se siguió la redirección.",
        );
      }
      if (current.protocol === "https:" && nextGuard.url.protocol === "http:") {
        return fail(
          "DESTINO_NO_SEGURO",
          "El sitio intentó degradar la conexión segura (HTTPS) a HTTP sin cifrar.",
          "No se siguió la redirección porque expondría el análisis a interceptación.",
        );
      }

      if (!redirectHosts.includes(nextGuard.url.host)) redirectHosts.push(nextGuard.url.host);
      current = nextGuard.url;
      continue;
    }

    const headers = headerMap(response.headers);
    const contentType = headers.get("content-type") ?? null;
    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      headers,
      setCookies: setCookieList(response.headers),
      contentType,
      body: response.body,
      bodyBytes: response.bodyBytes,
      truncated: response.truncated,
      finalUrl: current,
      redirects: redirectHosts,
      validatedAddresses: addresses.size,
      durationMs: Date.now() - started,
    };
  }

  return fail("SITIO_INACCESIBLE", "El sitio encadenó demasiadas redirecciones.", "Se detuvo el análisis para evitar bucles.");
}
