import { ApiError } from "@/lib/services/errors";

/* ═══════════════════════════════════════════════════════════════
   Guardas de petición para las rutas de escritura.

   1) Mismo origen (CSRF): si el navegador envía Origin, debe coincidir
      con el host público. `Sec-Fetch-Site: cross-site` se rechaza.
   2) JSON obligatorio y tamaño acotado: evita formularios simples y
      cuerpos gigantes que consuman memoria antes de la validación.
   ═══════════════════════════════════════════════════════════════ */

export const MAX_JSON_BYTES = 256 * 1024;

function requestHost(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0].trim().toLowerCase();
  return (req.headers.get("host") ?? "").trim().toLowerCase();
}

/** Compara el Origin con el host público; lanza 403 si no coincide. */
export function assertSameOrigin(req: Request): void {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    throw new ApiError(
      403,
      "ORIGEN_NO_PERMITIDO",
      "La petición proviene de otro sitio.",
      "Realiza la operación desde la aplicación de PRIVACYOS.",
    );
  }

  const origin = req.headers.get("origin");
  const host = requestHost(req);

  if (origin) {
    if (origin === "null") {
      throw new ApiError(403, "ORIGEN_NO_PERMITIDO", "El origen de la petición no es válido.");
    }
    let originHost = "";
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      throw new ApiError(403, "ORIGEN_NO_PERMITIDO", "El origen de la petición no es válido.");
    }
    if (!host || originHost !== host) {
      throw new ApiError(
        403,
        "ORIGEN_NO_PERMITIDO",
        "La petición no proviene del mismo origen.",
        "Recarga la aplicación e inténtalo nuevamente.",
      );
    }
    return;
  }

  // Navegadores antiguos pueden omitir Origin pero enviar Referer.
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      if (!host || refererHost !== host) {
        throw new ApiError(403, "ORIGEN_NO_PERMITIDO", "La petición no proviene del mismo origen.");
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(403, "ORIGEN_NO_PERMITIDO", "La petición no proviene del mismo origen.");
    }
  }
  // Sin Origin ni Referer: cliente no navegador (curl, pruebas, integraciones).
  // La autorización del espacio de trabajo sigue siendo obligatoria.
}

function assertJsonContentType(req: Request): void {
  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  const isJson =
    contentType.startsWith("application/json") ||
    /^application\/[a-z0-9.+-]+\+json/.test(contentType);
  if (!isJson) {
    throw new ApiError(
      415,
      "TIPO_CONTENIDO",
      "El cuerpo debe enviarse como application/json.",
      "Incluye la cabecera Content-Type: application/json.",
    );
  }
}

/** Lee y valida un cuerpo JSON con tope de tamaño. */
export async function parseJsonBodyLimited(req: Request): Promise<unknown> {
  assertJsonContentType(req);

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) {
    throw new ApiError(413, "CUERPO_DEMASIADO_GRANDE", "El cuerpo de la petición excede el límite permitido.");
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    throw new ApiError(400, "VALIDACION", "No se pudo leer el cuerpo de la petición.");
  }

  if (Buffer.byteLength(text, "utf8") > MAX_JSON_BYTES) {
    throw new ApiError(413, "CUERPO_DEMASIADO_GRANDE", "El cuerpo de la petición excede el límite permitido.");
  }
  if (!text.trim()) {
    throw new ApiError(400, "VALIDACION", "El cuerpo de la petición está vacío.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "VALIDACION", "El cuerpo de la petición no es un JSON válido.");
  }
}
