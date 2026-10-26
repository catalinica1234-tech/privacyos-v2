import { runAnalysis } from "@/lib/analyzer/engine";
import type { Analysis, AnalysisCreateInput, AnalysisUpdateInput } from "@/lib/contracts";
import {
  createAnalysis,
  deleteAnalysis,
  getAnalysis,
  listAnalyses,
  updateAnalysis,
  type AnalysisSummary,
} from "@/lib/repositories/analyses.repo";
import { ApiError } from "@/lib/services/errors";
import { shortId } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE SERVICIO · reglas de negocio del recurso analysis
   - La creación ejecuta el motor REAL (Hito 1) y luego persiste.
   - La persistencia es obligatoria: si falla la base responde 500.
   - Los códigos del motor se mapean a estados HTTP de la API.
   ═══════════════════════════════════════════════════════════════ */

const HTTP_POR_CODIGO: Record<string, number> = {
  URL_INVALIDA: 400,
  PROTOCOLO_NO_PERMITIDO: 403,
  DESTINO_NO_SEGURO: 403,
  SITIO_INACCESIBLE: 502,
  DESCONECTADO: 504,
  ERROR_INTERNO: 500,
};

export type AnalysisOut = AnalysisSummary & { payload: Analysis };

export async function listarAnalyses(opts?: { limit?: number; siteId?: string }): Promise<AnalysisSummary[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  return listAnalyses({ limit, siteId: opts?.siteId });
}

export async function crearAnalysis(input: AnalysisCreateInput): Promise<AnalysisOut> {
  // 1) Motor real (valida seguridad SSRF, descarga, hallazgos con evidencia).
  const result = await runAnalysis({ url: input.url, frameworkIds: input.frameworkIds });
  if (!result.ok) {
    const status = HTTP_POR_CODIGO[result.code] ?? 400;
    throw new ApiError(status, result.code, result.message, result.hint);
  }

  // 2) Persistencia real (el id PS-XXXXXX se genera aquí; reintenta ante colisión).
  for (let intento = 0; intento < 3; intento++) {
    const id = input.id ?? shortId();
    try {
      return await createAnalysis({
        id,
        url: result.analysis.input.url,
        score: result.analysis.score,
        riskLevel: result.analysis.riskLevel ?? null,
        payload: result.analysis,
        siteId: input.siteId ?? null,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002" && input.id === undefined) continue; // colisión de id → nuevo intento
      if (code === "P2003") {
        // FK: el siteId referenciado no existe (o no es válido) → 400, no 500.
        throw new ApiError(
          400,
          "VALIDACION",
          "El siteId indicado no corresponde a un sitio registrado.",
          "Revisa GET /api/sites para elegir un id válido.",
        );
      }
      throw err;
    }
  }
  throw new ApiError(500, "ERROR_INTERNO", "No se pudo asignar identificador único. Reintenta.");
}

export async function obtenerAnalysis(id: string): Promise<AnalysisOut> {
  const row = await getAnalysis(id);
  if (!row) {
    throw new ApiError(404, "NO_ENCONTRADO", `No existe un análisis con id ${id}.`, "Revisa GET /api/analyses.");
  }
  return row;
}

export async function editarAnalysis(id: string, patch: AnalysisUpdateInput): Promise<AnalysisOut> {
  try {
    return await updateAnalysis(id, patch);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new ApiError(404, "NO_ENCONTRADO", `No existe un análisis con id ${id}.`);
    }
    throw err;
  }
}

export async function eliminarAnalysis(id: string): Promise<void> {
  const ok = await deleteAnalysis(id);
  if (!ok) {
    throw new ApiError(404, "NO_ENCONTRADO", `No existe un análisis con id ${id}.`);
  }
}
