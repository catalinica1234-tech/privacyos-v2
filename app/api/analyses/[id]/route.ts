import { NextResponse } from "next/server";
import { analysisUpdateSchema } from "@/lib/contracts";
import { editarAnalysis, eliminarAnalysis, obtenerAnalysis } from "@/lib/services/analyses.service";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";
import { workspaceHash } from "@/lib/owner";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/analyses/{id} · controlador delgado
   GET detalle (con payload) · DELETE · PATCH notas/revisado
   Un id de otro espacio de trabajo responde 404, no 403, para no
   revelar su existencia.
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyses:get", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const ownerHash = workspaceHash(req);
    const { id } = await params;
    const analysis = await obtenerAnalysis(ownerHash, id);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    return routeError(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyses:delete", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const ownerHash = workspaceHash(req);
    const { id } = await params;
    await eliminarAnalysis(ownerHash, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return routeError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyses:update", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const ownerHash = workspaceHash(req);
    const { id } = await params;
    const body = await parseJsonBodyLimited(req);
    const parsed = analysisUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return jsonError(
        400,
        "VALIDACION",
        "La solicitud no superó la validación de entrada.",
        issue ? `${issue.path.join(".")}: ${issue.message}` : undefined,
      );
    }
    const analysis = await editarAnalysis(ownerHash, id, parsed.data);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    return routeError(err);
  }
}
