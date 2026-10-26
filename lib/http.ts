/* ═══════════════════════════════════════════════════════════════
   CONTROLADOR (HTTP) · helper de respuestas
   Traduce errores del dominio a códigos de estado y su envolvente.
   Nada de lógica de negocio aquí.
   ═══════════════════════════════════════════════════════════════ */
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/services/errors";

export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "VALIDACION", "El cuerpo de la petición no es un JSON válido.");
  }
}

export function routeError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { ok: false, code: err.code, message: err.message, hint: err.hint ?? undefined },
      { status: err.status },
    );
  }
  return NextResponse.json(
    {
      ok: false,
      code: "ERROR_INTERNO",
      message: "Error inesperado del servidor.",
      hint: "Vuelve a intentarlo en unos minutos.",
    },
    { status: 500 },
  );
}
