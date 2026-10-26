import { NextResponse } from "next/server";
import { parseJsonBody, routeError } from "@/lib/http";
import { analysisUpdateSchema } from "@/lib/contracts";
import { editarAnalysis, eliminarAnalysis, obtenerAnalysis } from "@/lib/services/analyses.service";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/analyses/{id} · controlador delgado
   GET detalle (con payload) · DELETE · PATCH notas/revisado
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx): Promise<NextResponse> {
  try {
    const { id } = await params;
    const analysis = await obtenerAnalysis(id);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    return routeError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<NextResponse> {
  try {
    const { id } = await params;
    await eliminarAnalysis(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return routeError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(req);
    const parsed = analysisUpdateSchema.safeParse(body);
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
    const analysis = await editarAnalysis(id, parsed.data);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    return routeError(err);
  }
}
