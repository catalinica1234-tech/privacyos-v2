import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/contracts";
import { runAnalysis } from "@/lib/analyzer/engine";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";

/* ═════════════════════════════════════════════════════════════════
   POST /api/analyze — Análisis REAL de una URL pública (sin persistir).
   Ejecuta validaciones de seguridad (SSRF), resolución DNS, una
   solicitud HTTP limitada y genera hallazgos con evidencia observada.
   El cliente guarda el resultado en localStorage; /api/analyses es la
   variante que además persiste.
   ═════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyze", limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const body = await parseJsonBodyLimited(req);
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(
        400,
        "URL_INVALIDA",
        "La solicitud no superó la validación de entrada.",
        first ? `${first.path.join(".")}: ${first.message}` : "Revisa los campos enviados.",
      );
    }

    const result = await runAnalysis(parsed.data);
    if (!result.ok) {
      const status =
        result.code === "ERROR_INTERNO"
          ? 500
          : result.code === "PROTOCOLO_NO_PERMITIDO" || result.code === "DESTINO_NO_SEGURO"
            ? 403
            : result.code === "SITIO_INACCESIBLE"
              ? 502
              : result.code === "DESCONECTADO"
                ? 504
                : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json({ ok: true, analysis: result.analysis });
  } catch (err) {
    return routeError(err);
  }
}
