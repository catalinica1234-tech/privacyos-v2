import { NextResponse } from "next/server";
import { parseJsonBody, routeError } from "@/lib/http";
import { siteCreateSchema } from "@/lib/contracts";
import { crearSite, listarSites } from "@/lib/services/sites.service";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/sites · controlador delgado
   POST crear sitio · GET listar sitios
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(req);
    const parsed = siteCreateSchema.safeParse(body);
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
    const site = await crearSite(parsed.data);
    return NextResponse.json({ ok: true, site }, { status: 201 });
  } catch (err) {
    return routeError(err);
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const sites = await listarSites();
    return NextResponse.json({ ok: true, sites });
  } catch (err) {
    return routeError(err);
  }
}
