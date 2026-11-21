import dns from "node:dns/promises";
import net from "node:net";

/* ═════════════════════════════════════════════════════════════════
   Guardas de seguridad para el análisis de URLs arbitrarias.
   Objetivo: que PRIVACYOS solo consulte destinos HTTP(S) públicos y
   legítimos desde el punto de vista del servidor — sin acceso a
   redes internas, metadatos de nube ni servicios locales (SSRF).

   Esta capa es deliberadamente conservadora:
   - Rechaza hosts internos y espacios de nombres reservados.
   - Resuelve DNS y exige que TODAS las direcciones sean públicas.
   - Bloquea IPv4 e IPv6 reservadas, incluidas las formas embebidas.
   - La conexión HTTP real fija la IP validada (anti DNS rebinding)
     en lib/analyzer/http-safe.ts.
   ═════════════════════════════════════════════════════════════════ */

export type SafetyResult =
  | { ok: true; url: URL }
  | { ok: false; code: "URL_INVALIDA" | "PROTOCOLO_NO_PERMITIDO" | "DESTINO_NO_SEGURO"; reason: string };

export const MAX_URL_LENGTH = 2048;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata.google.com",
  "metadata.azure.internal",
  "metadata.aws.internal",
  "instance-data",
  "instance-data.ec2.internal",
]);

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".lan",
  ".intranet",
  ".home",
  ".corp",
  ".svc",
  ".cluster.local",
  ".internal.cloudapp.net",
];

/* ── IPv4 ─────────────────────────────────────────────────────── */

export function parseIpv4(ip: string): [number, number, number, number] | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums as [number, number, number, number];
}

/** Rangos IPv4 que nunca deben consultarse desde el servidor. */
export function isPrivateIpv4(ip: string): boolean {
  const p = parseIpv4(ip);
  if (!p) return false;
  const [a, b, c] = p;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / metadatos
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return true; // 6to4 relay anycast
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast, reservado y broadcast
  return false;
}

/* ── IPv6 ─────────────────────────────────────────────────────── */

function stripBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

/** Expande una IPv6 válida a 8 grupos de 16 bits. */
export function expandIpv6(raw: string): number[] | null {
  let ip = stripBrackets(raw.trim().toLowerCase());
  if (ip.includes("%")) return null; // zone-id no permitido
  if (net.isIP(ip) !== 6) return null;

  // Convierte una cola IPv4 (::ffff:127.0.0.1) a dos grupos hexadecimales.
  if (ip.includes(".")) {
    const idx = ip.lastIndexOf(":");
    if (idx < 0) return null;
    const v4 = parseIpv4(ip.slice(idx + 1));
    if (!v4) return null;
    const hi = ((v4[0] << 8) | v4[1]).toString(16);
    const lo = ((v4[2] << 8) | v4[3]).toString(16);
    ip = `${ip.slice(0, idx + 1)}${hi}:${lo}`;
  }

  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];

  if (halves.length === 1) {
    if (left.length !== 8) return null;
    const groups = left.map((h) => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN));
    return groups.some((n) => Number.isNaN(n)) ? null : groups;
  }

  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right].map((h) =>
    /^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN,
  );
  return groups.some((n) => Number.isNaN(n)) ? null : groups;
}

/** Rangos IPv6 no enrutables o reservados que deben bloquearse. */
export function isPrivateIpv6(raw: string): boolean {
  const groups = expandIpv6(raw);
  if (!groups) return true; // si no se puede analizar, se bloquea

  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups;
  const firstFiveZero = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0;

  // ::/96 (incluye :: y ::1) y IPv4-compatible.
  if (firstFiveZero && g5 === 0) return true;
  // IPv4-mapped ::ffff:0:0/96 → se valida la IPv4 embebida.
  if (firstFiveZero && g5 === 0xffff) {
    const ipv4 = `${g6 >> 8}.${g6 & 0xff}.${g7 >> 8}.${g7 & 0xff}`;
    return isPrivateIpv4(ipv4);
  }

  if (g0 === 0x0064 && g1 === 0xff9b) return true; // NAT64
  if (g0 === 0x0100 && g1 === 0 && g2 === 0 && g3 === 0) return true; // discard-only
  if (g0 === 0x2001 && g1 === 0x0000) return true; // Teredo
  if (g0 === 0x2001 && g1 === 0x0db8) return true; // documentación
  if (g0 === 0x2001 && (g1 & 0xfff0) === 0x0010) return true; // ORCHID
  if (g0 === 0x2001 && (g1 & 0xfff0) === 0x0020) return true; // ORCHIDv2
  if (g0 === 0x2002) return true; // 6to4 (IPv4 embebida)
  if ((g0 & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
  if ((g0 & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((g0 & 0xffc0) === 0xfec0) return true; // site-local obsoleto
  if ((g0 & 0xff00) === 0xff00) return true; // multicast
  if ((g0 & 0xe000) !== 0x2000) return true; // fuera de 2000::/3 (global unicast)

  return false;
}

/** true si la IP (v4 o v6) es privada/reservada. Una cadena inválida no se considera IP. */
export function isPrivateIp(ip: string): boolean {
  const clean = stripBrackets(ip.trim());
  const version = net.isIP(clean);
  if (version === 4) return isPrivateIpv4(clean);
  if (version === 6) return isPrivateIpv6(clean);
  return false;
}

/** Para resultados de DNS: cualquier cosa no pública se bloquea. */
export function isBlockedIp(ip: string): boolean {
  const clean = stripBrackets(ip.trim());
  const version = net.isIP(clean);
  if (version === 4) return isPrivateIpv4(clean);
  if (version === 6) return isPrivateIpv6(clean);
  return true;
}

/* ── Validación de URL ────────────────────────────────────────── */

export function validateTargetUrl(raw: string): SafetyResult {
  if (typeof raw !== "string" || raw.length > MAX_URL_LENGTH) {
    return { ok: false, code: "URL_INVALIDA", reason: "La URL excede la longitud máxima permitida." };
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, code: "URL_INVALIDA", reason: "No es una URL con formato válido." };
  }

  if (url.href.length > MAX_URL_LENGTH) {
    return { ok: false, code: "URL_INVALIDA", reason: "La URL excede la longitud máxima permitida." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      code: "PROTOCOLO_NO_PERMITIDO",
      reason: `Protocolo no permitido (${url.protocol}). Solo se analizan direcciones HTTP/HTTPS públicas.`,
    };
  }
  if (url.username || url.password) {
    return { ok: false, code: "URL_INVALIDA", reason: "La URL no puede incluir credenciales embebidas." };
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    return {
      ok: false,
      code: "DESTINO_NO_SEGURO",
      reason: `Puerto no permitido (${url.port}). Solo se aceptan los puertos estándar 80 y 443.`,
    };
  }

  const rawHost = stripBrackets(url.hostname.toLowerCase()).replace(/\.$/, "");
  if (!rawHost) {
    return { ok: false, code: "URL_INVALIDA", reason: "La URL no contiene un hostname." };
  }
  if (rawHost.includes("%") || rawHost.includes("\\") || /\s/.test(rawHost)) {
    return { ok: false, code: "URL_INVALIDA", reason: "El hostname contiene caracteres no permitidos." };
  }

  const ipVersion = net.isIP(rawHost);
  if (BLOCKED_HOSTNAMES.has(rawHost)) {
    return { ok: false, code: "DESTINO_NO_SEGURO", reason: `“${rawHost}” es un destino interno no analizable.` };
  }
  if (BLOCKED_HOST_SUFFIXES.some((sfx) => rawHost.endsWith(sfx))) {
    return {
      ok: false,
      code: "DESTINO_NO_SEGURO",
      reason: `“${rawHost}” pertenece a un espacio de nombres interno.`,
    };
  }
  if (!ipVersion && !rawHost.includes(".")) {
    return { ok: false, code: "URL_INVALIDA", reason: "El hostname no parece ser un dominio público válido." };
  }
  if (ipVersion && isBlockedIp(rawHost)) {
    return {
      ok: false,
      code: "DESTINO_NO_SEGURO",
      reason: "El destino apunta a una dirección de red privada o reservada.",
    };
  }

  return { ok: true, url };
}

/* ── Resolución DNS ───────────────────────────────────────────── */

export async function resolveAndGuardHost(hostname: string): Promise<
  | { ok: true; ips: string[] }
  | { ok: false; code: "DESTINO_NO_SEGURO" | "SITIO_INACCESIBLE"; reason: string }
> {
  const host = stripBrackets(hostname.toLowerCase()).replace(/\.$/, "");

  // Si ya es una IP literal, no se consulta DNS.
  if (net.isIP(host)) {
    if (isBlockedIp(host)) {
      return {
        ok: false,
        code: "DESTINO_NO_SEGURO",
        reason: "El destino apunta a una dirección de red privada o reservada.",
      };
    }
    return { ok: true, ips: [host] };
  }

  try {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    const ips = [...new Set(records.map((r) => r.address))];
    if (ips.length === 0) {
      return { ok: false, code: "SITIO_INACCESIBLE", reason: "El dominio no resolvió a ninguna dirección IP." };
    }
    // Se exige que TODAS las direcciones sean públicas: si una sola apunta a
    // la red interna, el destino se rechaza (evita selección por parte del atacante).
    if (ips.some(isBlockedIp)) {
      return {
        ok: false,
        code: "DESTINO_NO_SEGURO",
        reason:
          "El dominio resuelve hacia una dirección privada o reservada; por seguridad, no se consulta el destino.",
      };
    }
    return { ok: true, ips };
  } catch {
    return { ok: false, code: "SITIO_INACCESIBLE", reason: "No se pudo resolver el dominio (DNS)." };
  }
}
