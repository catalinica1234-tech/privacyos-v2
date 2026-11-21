import { NextResponse } from "next/server";
import { workspaceHash } from "@/lib/owner";
import { getAnalysis } from "@/lib/repositories/analyses.repo";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { assistantRequestSchema } from "@/lib/contracts";
import { asistenteDisponible, DISCLAIMER, explicar } from "@/lib/services/assistant.service";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";

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
  const limited = enforceRateLimit(req, { name: "assistant", limit: 20, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
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

    const body = await parseJsonBodyLimited(req);
    const parsed = assistantRequestSchema.safeParse(body);
    // 400: contrato inválido (pregunta o informe con forma incorrecta).
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return jsonError(
        400,
        "VALIDACION",
        "La solicitud no superó la validación de entrada.",
        issue ? `${issue.path.join(".")}: ${issue.message}` : undefined,
      );
    }

    const { question, analysisId } = parsed.data;
    const report = analysisId ? await getAnalysis(workspaceHash(req), analysisId) : null;
    if (analysisId && !report) {
      return jsonError(404, "INFORME_NO_DISPONIBLE", "El informe no está disponible en este espacio.", "Para consultar un concepto general, abre el asistente desde el panel.");
    }

    let answer: string;
    try {
      answer = await explicar(question, report?.payload);
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
