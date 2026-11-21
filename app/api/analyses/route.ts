import { NextResponse } from "next/server";
import { analysisCreateSchema } from "@/lib/contracts";
import { crearAnalysis, eliminarEspacio, listarAnalyses } from "@/lib/services/analyses.service";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";
import { workspaceHash } from "@/lib/owner";

/* ═══════════════════════════════════════════════════════════════
   Ruta: /api/analyses · controlador delgado
   POST crear (corre el motor REAL y persiste) · GET listar
   Todas las operaciones se limitan al espacio de trabajo del token.
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyses:create", limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const ownerHash = workspaceHash(req);
    const body = await parseJsonBodyLimited(req);
    const parsed = analysisCreateSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return jsonError(
        400,
        "VALIDACION",
        "La solicitud no superó la validación de entrada.",
        issue ? `${issue.path.join(".")}: ${issue.message}` : undefined,
      );
    }
    const analysis = await crearAnalysis(ownerHash, parsed.data);
    return NextResponse.json({ ok: true, analysis }, { status: 201 });
  } catch (err) {
    return routeError(err);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyses:list", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const ownerHash = workspaceHash(req);
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const siteId = searchParams.get("siteId") ?? undefined;
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const analyses = await listarAnalyses(ownerHash, {
      limit: Number.isNaN(limit as number) ? undefined : limit,
      siteId,
    });
    return NextResponse.json({ ok: true, analyses });
  } catch (err) {
    return routeError(err);
  }
}

/**
 * Borra TODO el espacio de trabajo anónimo (análisis y sitios).
 * Exige la cabecera de confirmación explícita para evitar borrados
 * accidentales por parte de clientes que reutilicen la cookie.
 */
export async function DELETE(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "analyses:purge", limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    if (req.headers.get("x-confirm-delete") !== "workspace") {
      return jsonError(
        400,
        "CONFIRMACION_REQUERIDA",
        "La operación de borrado requiere confirmación explícita.",
        "Envía la cabecera x-confirm-delete: workspace desde la interfaz.",
      );
    }
    const ownerHash = workspaceHash(req);
    const deleted = await eliminarEspacio(ownerHash);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    return routeError(err);
  }
}
