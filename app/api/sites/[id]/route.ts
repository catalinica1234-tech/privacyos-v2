import { NextResponse } from "next/server";
import { parseJsonBody, routeError } from "@/lib/http";
import { siteUpdateSchema } from "@/lib/contracts";
import { editarSite, eliminarSite, obtenerSite } from "@/lib/services/sites.service";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/sites/{id} · controlador delgado
   GET detalle · DELETE eliminar · PATCH parcial
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx): Promise<NextResponse> {
  try {
    const { id } = await params;
    const site = await obtenerSite(id);
    return NextResponse.json({ ok: true, site });
  } catch (err) {
    return routeError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<NextResponse> {
  try {
    const { id } = await params;
    await eliminarSite(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return routeError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(req);
    const parsed = siteUpdateSchema.safeParse(body);
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
    const site = await editarSite(id, parsed.data);
    return NextResponse.json({ ok: true, site });
  } catch (err) {
    return routeError(err);
  }
}
