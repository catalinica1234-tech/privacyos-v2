import { NextResponse } from "next/server";
import { checkDatabase, databaseConfigured } from "@/lib/db";
import { asistenteDisponible } from "@/lib/services/assistant.service";
import { enforceRateLimit, jsonError } from "@/lib/http";

/* ═══════════════════════════════════════════════════════════════
   GET /api/health · estado operativo sin secretos.
   - database: ok | unavailable | not_configured
   - assistant: enabled | disabled
   Responde 200 solo si la base está operativa (el asistente es
   opcional y su caída no tumba el producto).
   ═══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const limited = enforceRateLimit(req, { name: "health", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const configured = databaseConfigured();
  const databaseOk = configured ? await checkDatabase(2000) : false;
  const database = !configured ? "not_configured" : databaseOk ? "ok" : "unavailable";
  const assistant = asistenteDisponible() ? "enabled" : "disabled";

  if (!databaseOk) {
    return jsonError(
      503,
      "SERVICIO_DEGRADADO",
      "La base de datos no está disponible.",
      "El motor de análisis puede funcionar, pero la persistencia está fuera de línea.",
      { "Cache-Control": "no-store" },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      service: "privacyos",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      checks: { database, assistant },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
