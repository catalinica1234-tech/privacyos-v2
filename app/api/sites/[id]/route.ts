import { NextResponse } from "next/server";
import { siteUpdateSchema } from "@/lib/contracts";
import { editarSite, eliminarSite, obtenerSite } from "@/lib/services/sites.service";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";
import { workspaceHash } from "@/lib/owner";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/sites/{id} · controlador delgado
   GET detalle · DELETE eliminar · PATCH parcial
   Un id de otro espacio de trabajo responde 404.
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "sites:get", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const ownerHash = workspaceHash(req);
    const { id } = await params;
    const site = await obtenerSite(ownerHash, id);
    return NextResponse.json({ ok: true, site });
  } catch (err) {
    return routeError(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "sites:delete", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const ownerHash = workspaceHash(req);
    const { id } = await params;
    await eliminarSite(ownerHash, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return routeError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "sites:update", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const ownerHash = workspaceHash(req);
    const { id } = await params;
    const body = await parseJsonBodyLimited(req);
    const parsed = siteUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return jsonError(
        400,
        "VALIDACION",
        "La solicitud no superó la validación de entrada.",
        issue ? `${issue.path.join(".")}: ${issue.message}` : undefined,
      );
    }
    const site = await editarSite(ownerHash, id, parsed.data);
    return NextResponse.json({ ok: true, site });
  } catch (err) {
    return routeError(err);
  }
}
