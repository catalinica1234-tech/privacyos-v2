import { NextResponse } from "next/server";
import { ApiError } from "@/lib/services/errors";
import { parseJsonBodyLimited } from "@/lib/request";
import { rateLimit, type RateLimitOptions, type RateLimitResult } from "@/lib/rate-limit";

/* ═══════════════════════════════════════════════════════════════
   CONTROLADOR (HTTP) · helpers de respuesta
   Traduce errores del dominio a códigos de estado y su envolvente.
   Nada de lógica de negocio aquí.
   ═══════════════════════════════════════════════════════════════ */

/** @deprecated Usa parseJsonBodyLimited; se mantiene por compatibilidad interna. */
export async function parseJsonBody(req: Request): Promise<unknown> {
  return parseJsonBodyLimited(req);
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  hint?: string,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { ok: false, code, message, hint: hint ?? undefined },
    { status, headers },
  );
}

/**
 * Detecta fallos de disponibilidad de la base sin confundirlos con
 * errores de negocio (P2025 = no encontrado, P2002 = duplicado, etc.).
 */
export function isDatabaseUnavailable(err: unknown): boolean {
  const e = err as { name?: string; code?: string; message?: string };
  const name = e?.name ?? "";
  const code = e?.code ?? "";
  const message = typeof e?.message === "string" ? e.message : "";

  if (name === "PrismaClientInitializationError") return true;
  if (["P1001", "P1002", "P1008", "P1017", "P2021", "P2022", "P2024"].includes(code)) return true;
  return /can't reach database server|tenant\/user .* not found|getaddrinfo|econnrefused|connection terminated|timed out fetching a new connection/i.test(
    message,
  );
}

export function routeError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.code, err.message, err.hint);
  }

  if (isDatabaseUnavailable(err)) {
    // No se registra la URL de conexión ni el mensaje completo de Prisma:
    // ambos pueden contener credenciales o el identificador del tenant.
    console.error("[api] base de datos no disponible");
    return jsonError(
      503,
      "BASE_DE_DATOS_NO_DISPONIBLE",
      "El servicio de datos está temporalmente fuera de línea.",
      "No se perdió tu informe: vuelve a intentarlo cuando el servicio se restablezca.",
      { "Retry-After": "60" },
    );
  }

  const name = err instanceof Error ? err.name : "UnknownError";
  console.error(`[api] error interno (${name})`);
  return jsonError(
    500,
    "ERROR_INTERNO",
    "Error inesperado del servidor.",
    "Vuelve a intentarlo en unos minutos.",
  );
}

export function rateLimitResponse(result: Extract<RateLimitResult, { ok: false }>): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      code: "DEMASIADAS_PETICIONES",
      message: "Se recibieron demasiadas peticiones en poco tiempo.",
      hint: `Espera ${result.retryAfter} segundo(s) e inténtalo nuevamente.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

/** Aplica el límite; devuelve una respuesta 429 si se excedió, o null si puede continuar. */
export function enforceRateLimit(req: Request, options: RateLimitOptions): NextResponse | null {
  const result = rateLimit(req, options);
  return result.ok ? null : rateLimitResponse(result);
}
