import { createHash } from "node:crypto";
import { runAnalysis } from "@/lib/analyzer/engine";
import type { Analysis, AnalysisCreateInput, AnalysisUpdateInput } from "@/lib/contracts";
import { checkDatabase } from "@/lib/db";
import {
  createAnalysis,
  deleteAnalysis,
  deleteWorkspaceData,
  getAnalysis,
  listAnalyses,
  updateAnalysis,
  type AnalysisSummary,
} from "@/lib/repositories/analyses.repo";
import { getSite } from "@/lib/repositories/sites.repo";
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

export async function listarAnalyses(
  ownerHash: string,
  opts?: { limit?: number; siteId?: string },
): Promise<AnalysisSummary[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  return listAnalyses(ownerHash, { limit, siteId: opts?.siteId });
}

export async function crearAnalysis(ownerHash: string, input: AnalysisCreateInput): Promise<AnalysisOut> {
  // 0) Falla rápido si la base no está disponible: no se ejecuta un
  //    análisis costoso que después no podrá persistirse.
  if (!(await checkDatabase())) {
    throw new ApiError(
      503,
      "BASE_DE_DATOS_NO_DISPONIBLE",
      "El servicio de datos está temporalmente fuera de línea.",
      "No se ejecutó el análisis para no perder el resultado. Inténtalo cuando el servicio se restablezca.",
    );
  }

  // 1) Si se adjunta a un sitio, debe pertenecer al MISMO espacio de trabajo.
  //    La FK sola no basta: permitiría enlazar análisis a un sitio ajeno.
  if (input.siteId) {
    const site = await getSite(ownerHash, input.siteId);
    if (!site) {
      throw new ApiError(
        400,
        "VALIDACION",
        "El siteId indicado no corresponde a un sitio de este espacio de trabajo.",
        "Revisa GET /api/sites para elegir un id válido.",
      );
    }
  }

  // El identificador de reintento tiene alcance de workspace.
  const requestHash = input.id
    ? createHash("sha256").update(`privacyos-analysis:${ownerHash}:${input.id}`).digest("hex")
    : undefined;
  const requestedId = requestHash
    ? `PS-${BigInt("0x" + requestHash).toString(36).toUpperCase().slice(-6).padStart(6, "0")}`
    : undefined;
  if (requestedId) {
    const existing = await getAnalysis(ownerHash, requestedId);
    if (existing) {
      if (existing.payload.input.url === input.url &&
        existing.siteId === (input.siteId ?? null) &&
        JSON.stringify(existing.payload.input.frameworkIds) === JSON.stringify(input.frameworkIds)) {
        return existing;
      }
      throw new ApiError(409, "CONFLICTO", "El análisis ya existe con otros datos.");
    }
  }

  // 2) Motor real (valida seguridad SSRF, descarga, hallazgos con evidencia).
  const result = await runAnalysis({
    id: requestedId,
    url: input.url,
    frameworkIds: input.frameworkIds,
  });
  if (!result.ok) {
    const status = HTTP_POR_CODIGO[result.code] ?? 400;
    throw new ApiError(status, result.code, result.message, result.hint);
  }

  // 3) Persistencia real. El id del payload y el id de la fila deben ser
  //    el mismo: el informe se enlaza por el id que devuelve la API.
  let id = requestedId ?? result.analysis.id;
  for (let intento = 0; intento < 3; intento++) {
    try {
      return await createAnalysis({
        ownerHash,
        id,
        url: result.analysis.input.url,
        score: result.analysis.score,
        riskLevel: result.analysis.riskLevel ?? null,
        payload: id === result.analysis.id ? result.analysis : { ...result.analysis, id },
        siteId: input.siteId ?? null,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        id = shortId();
        continue;
      }
      if (code === "P2003") {
        // FK: carrera entre la comprobación de pertenencia y el insert.
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

export async function obtenerAnalysis(ownerHash: string, id: string): Promise<AnalysisOut> {
  const row = await getAnalysis(ownerHash, id);
  if (!row) {
    throw new ApiError(404, "NO_ENCONTRADO", `No existe un análisis con id ${id}.`, "Revisa GET /api/analyses.");
  }
  return row;
}

export async function editarAnalysis(
  ownerHash: string,
  id: string,
  patch: AnalysisUpdateInput,
): Promise<AnalysisOut> {
  try {
    return await updateAnalysis(ownerHash, id, patch);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new ApiError(404, "NO_ENCONTRADO", `No existe un análisis con id ${id}.`);
    }
    throw err;
  }
}

export async function eliminarAnalysis(ownerHash: string, id: string): Promise<void> {
  const ok = await deleteAnalysis(ownerHash, id);
  if (!ok) {
    throw new ApiError(404, "NO_ENCONTRADO", `No existe un análisis con id ${id}.`);
  }
}

/** Borra todo el espacio de trabajo (análisis y sitios) de forma atómica. */
export async function eliminarEspacio(ownerHash: string): Promise<{ analyses: number; sites: number }> {
  return deleteWorkspaceData(ownerHash);
}
