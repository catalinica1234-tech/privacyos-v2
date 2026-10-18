import dns from "node:dns/promises";

/* ═════════════════════════════════════════════════════════════════
   Guardas de seguridad para el análisis de URLs arbitrarias.
   Objetivo: que PRIVACYOS solo consulte destinos HTTP(S) públicos y
   legítimos desde el punto de vista del servidor — sin acceso a
   redes internas, metadatos de nube ni servicios locales (SSRF).
   ═════════════════════════════════════════════════════════════════ */

export type SafetyResult =
  | { ok: true; url: URL }
  | { ok: false; code: "URL_INVALIDA" | "PROTOCOLO_NO_PERMITIDO" | "DESTINO_NO_SEGURO"; reason: string };

export const MAX_URL_LENGTH = 2048;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "metadata.google.internal",
  "metadata.google.com",
  "metadata.azure.internal",
  "metadata.aws.internal",
]);

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".intranet",
  ".home",
  ".corp",
  ".svc",
  ".svc.cluster.local",
  ".internal.cloudapp.net",
  ".blob.core.windows.net", // endpoint sensible relativo al storage account
];

/** Comprueba si una IPv4 pertenece a un rango privado/reservado.
 *  Si la cadena no es una IPv4 válida devuelve false: la verificación
 *  autoritativa se hace sobre las IPs resultantes de la resolución DNS. */
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return false; // no es IP literal
  const n = parts.map(Number);
  if (n.some((x) => x > 255)) return false; // IPv4 malformada, no privada
  const [a, b] = n;
  if (a === 0 || a === 10 || a === 127) return true;                       // this-red / loopback
  if (a === 169 && b === 254) return true;                                 // link-local / metadatos cloud
  if (a === 172 && b >= 16 && b <= 31) return true;                        // RFC1918
  if (a === 192 && b === 168) return true;                                 // RFC1918
  if (a === 192 && b === 0 && n[2] === 0 && n[3] === 0) return true;       // 192.0.0.0/24
  if (a === 100 && b >= 64 && b <= 127) return true;                       // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true;                    // benchmark
  if (a >= 224) return true;                                               // multicast/reservado
  return false;
}

/** Comprueba si una IPv6 es loopback, link-local o ULA (fc00::/7). */
export function isPrivateIpv6(ipRaw: string): boolean {
  const ip = ipRaw.toLowerCase();
  if (ip === "::1" || ip === "::") return true;
  if (ip.startsWith("fe80")) return true;                 // link-local
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // ULA
  if (ip.startsWith("::ffff:")) return isPrivateIpv4(ip.slice(7)); // mapped IPv4
  return false;
}

export function isPrivateIp(ip: string): boolean {
  if (isPrivateIpv4(ip)) return true;
  if (ip.includes(":") && isPrivateIpv6(ip)) return true;
  return false;
}

/** Validación sintáctica + políticas de portales permitidos. */
export function validateTargetUrl(raw: string): SafetyResult {
  let url: URL;
  try {
    url = new URL(raw);
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
    return {
      ok: false,
      code: "URL_INVALIDA",
      reason: "La URL no puede incluir credenciales embebidas.",
    };
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    return {
      ok: false,
      code: "DESTINO_NO_SEGURO",
      reason: `Puerto no permitido (${url.port}). Solo se aceptan los puertos estándar 80 y 443.`,
    };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, ""); // sin FQDN root
  if (!host || !host.includes(".") && host !== "localhost") {
    return { ok: false, code: "URL_INVALIDA", reason: "El hostname no parece ser un dominio público válido." };
  }
  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, code: "DESTINO_NO_SEGURO", reason: `“${host}” es un destino interno no analizable.` };
  }
  if (BLOCKED_HOST_SUFFIXES.some((sfx) => host.endsWith(sfx))) {
    return { ok: false, code: "DESTINO_NO_SEGURO", reason: `“${host}” pertenece a un espacio de nombres interno.` };
  }
  if (isPrivateIp(host)) {
    return { ok: false, code: "DESTINO_NO_SEGURO", reason: "El destino apunta a una dirección de red privada o reservada." };
  }
  return { ok: true, url };
}

/** Resuelve DNS y verifica que ninguna IP resultante sea privada (SSRF). */
export async function resolveAndGuardHost(hostname: string): Promise<
  | { ok: true; ips: string[] }
  | { ok: false; code: "DESTINO_NO_SEGURO" | "SITIO_INACCESIBLE"; reason: string }
> {
  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    const ips = records.map((r) => r.address);
    if (ips.length === 0) {
      return { ok: false, code: "SITIO_INACCESIBLE", reason: "El dominio no resolvió a ninguna dirección IP." };
    }
    const privadas = ips.filter(isPrivateIp);
    if (privadas.length > 0) {
      return {
        ok: false,
        code: "DESTINO_NO_SEGURO",
        reason:
          "El dominio resuelve hacia una dirección privada o reservada; por seguridad, no se consulta el destino.",
      };
    }
    return { ok: true, ips };
  } catch {
    return {
      ok: false,
      code: "SITIO_INACCESIBLE",
      reason: "No se pudo resolver el dominio (DNS).",
    };
  }
}
