import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/contracts";
import { runAnalysis } from "@/lib/analyzer/engine";

/* ═════════════════════════════════════════════════════════════════
   POST /api/analyze — Análisis REAL de una URL pública.
   Ejecuta validaciones de seguridad (SSRF), resolución DNS, una
   solicitud HTTP limitada y genera hallazgos con evidencia observada.
   No existe backend persistente: el cliente guarda el resultado en
   localStorage (migración planificada a Hito 2).
   ═════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "URL_INVALIDA",
        message: "El cuerpo de la petición no es un JSON válido.",
        hint: "Envía { url, frameworkIds } como JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        code: "URL_INVALIDA",
        message: "La solicitud no superó la validación de entrada.",
        hint: first ? `${first.path.join(".")}: ${first.message}` : "Revisa los campos enviados.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runAnalysis(parsed.data);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.code === "ERROR_INTERNO" ? 500 : 400 });
    }
    return NextResponse.json({ ok: true, analysis: result.analysis });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        code: "ERROR_INTERNO",
        message: "Error inesperado mientras se ejecutaba el motor de análisis.",
        hint: err instanceof Error ? err.message : "Vuelve a intentarlo en unos minutos.",
      },
      { status: 500 },
    );
  }
}
