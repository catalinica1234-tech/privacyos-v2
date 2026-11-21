import { NextResponse } from "next/server";
import { siteCreateSchema } from "@/lib/contracts";
import { crearSite, listarSites } from "@/lib/services/sites.service";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";
import { workspaceHash } from "@/lib/owner";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/sites · controlador delgado
   POST crear sitio · GET listar sitios del espacio de trabajo
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "sites:create", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const ownerHash = workspaceHash(req);
    const body = await parseJsonBodyLimited(req);
    const parsed = siteCreateSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return jsonError(
        400,
        "VALIDACION",
        "La solicitud no superó la validación de entrada.",
        issue ? `${issue.path.join(".")}: ${issue.message}` : undefined,
      );
    }
    const site = await crearSite(ownerHash, parsed.data);
    return NextResponse.json({ ok: true, site }, { status: 201 });
  } catch (err) {
    return routeError(err);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "sites:list", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const ownerHash = workspaceHash(req);
    const sites = await listarSites(ownerHash);
    return NextResponse.json({ ok: true, sites });
  } catch (err) {
    return routeError(err);
  }
}
