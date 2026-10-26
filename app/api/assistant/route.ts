import { NextResponse } from "next/server";
import { parseJsonBody, routeError } from "@/lib/http";
import { assistantRequestSchema } from "@/lib/contracts";
import { asistenteDisponible, DISCLAIMER, explicar } from "@/lib/services/assistant.service";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/assistant · controlador delgado
   POST explicar un hallazgo/informe en palabras sencillas.
   - La llamada al proveedor de IA ocurre SOLO aquí (servidor).
   - La clave GEMINI_API_KEY nunca llega al navegador.
   - Feature flag: ASSISTANT_ENABLED=1; si está apagado → 503.
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!asistenteDisponible()) {
      return NextResponse.json(
        {
          ok: false,
          code: "ASISTENTE_APAGADO",
          message: "El asistente explicativo no está disponible ahora.",
          hint: "Puedes usar el informe con toda la información: hallazgos, evidencias y plan.",
        },
        { status: 503 },
      );
    }

    const body = await parseJsonBody(req);
    const parsed = assistantRequestSchema.safeParse(body);
    // 400: contrato inválido (pregunta o informe con forma incorrecta).
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDACION",
          message: "La solicitud no superó la validación de entrada.",
          hint: issue ? `${issue.path.join(".")}: ${issue.message}` : undefined,
        },
        { status: 400 },
      );
    }

    let answer: string;
    try {
      answer = await explicar(parsed.data.question, parsed.data.analysis);
    } catch (err) {
      const code = (err as Error).message ?? "";
      // Log de diagnóstico en el servidor (sin secretos ni contenido del informe).
      console.error("[assistant] fallo del proveedor:", code);
      if (code === "GEMINI_429" || code === "GEMINI_503") {
        return NextResponse.json(
          {
            ok: false,
            code: "CUOTA",
            message: "El asistente alcanzó su cuota temporal. Intenta en unos minutos.",
          },
          { status: 503 },
        );
      }
      // Cualquier otro fallo del proveedor no filtra detalles internos.
      return NextResponse.json(
        {
          ok: false,
          code: "ASISTENTE_INDISPONIBLE",
          message: "No se pudo generar la explicación en este momento.",
          hint: "El informe completo sigue disponible en las demás pestañas.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, answer, disclaimer: DISCLAIMER });
  } catch (err) {
    return routeError(err);
  }
}
