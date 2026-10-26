import { NextResponse } from "next/server";
import { parseJsonBody, routeError } from "@/lib/http";
import { analysisCreateSchema } from "@/lib/contracts";
import { crearAnalysis, listarAnalyses } from "@/lib/services/analyses.service";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/analyses · controlador delgado
   POST crear (corre el motor REAL y persiste) · GET listar
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(req);
    const parsed = analysisCreateSchema.safeParse(body);
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
    const analysis = await crearAnalysis(parsed.data);
    return NextResponse.json({ ok: true, analysis }, { status: 201 });
  } catch (err) {
    return routeError(err);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const siteId = searchParams.get("siteId") ?? undefined;
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const analyses = await listarAnalyses({ limit: Number.isNaN(limit as number) ? undefined : limit, siteId });
    return NextResponse.json({ ok: true, analyses });
  } catch (err) {
    return routeError(err);
  }
}
