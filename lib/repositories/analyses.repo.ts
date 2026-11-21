import type { Analysis } from "@/lib/contracts";
import { getPrisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE DATOS · repositorio de analyses
   Único archivo que consulta la tabla analyses. Todas las consultas
   filtran por ownerHash: el aislamiento no depende de la UI.
   Los listados no devuelven payload (pesado); el detalle sí.
   ═══════════════════════════════════════════════════════════════ */

export interface AnalysisSummary {
  id: string;
  url: string;
  score: number;
  riskLevel: string | null;
  notas: string | null;
  revisado: boolean;
  siteId: string | null;
  createdAt: string;
}

export interface AnalysisDetailRow extends AnalysisSummary {
  payload: Analysis;
}

const SUMMARY_SELECT = {
  id: true,
  url: true,
  score: true,
  riskLevel: true,
  notas: true,
  revisado: true,
  siteId: true,
  createdAt: true,
} as const;

function toSummary(row: {
  id: string;
  url: string;
  score: number;
  riskLevel: string | null;
  notas: string | null;
  revisado: boolean;
  siteId: string | null;
  createdAt: Date;
}): AnalysisSummary {
  // Se enumeran los campos públicos: nunca se propaga ownerHash ni
  // ninguna columna interna aunque Prisma devuelva la fila completa.
  return {
    id: row.id,
    url: row.url,
    score: row.score,
    riskLevel: row.riskLevel,
    notas: row.notas,
    revisado: row.revisado,
    siteId: row.siteId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createAnalysis(input: {
  ownerHash: string;
  id: string;
  url: string;
  score: number;
  riskLevel: string | null;
  payload: Analysis;
  siteId?: string | null;
}): Promise<AnalysisDetailRow> {
  const prisma = getPrisma();
  const row = await prisma.analysis.create({
    data: {
      id: input.id,
      ownerHash: input.ownerHash,
      url: input.url,
      score: Math.round(input.score),
      riskLevel: input.riskLevel ?? null,
      payload: input.payload as unknown as object,
      siteId: input.siteId ?? null,
    },
  });
  return { ...toSummary(row), payload: input.payload };
}

export async function listAnalyses(
  ownerHash: string,
  opts?: { limit?: number; siteId?: string },
): Promise<AnalysisSummary[]> {
  const prisma = getPrisma();
  const rows = await prisma.analysis.findMany({
    where: { ownerHash, ...(opts?.siteId ? { siteId: opts.siteId } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    select: SUMMARY_SELECT,
  });
  return rows.map(toSummary);
}

export async function getAnalysis(ownerHash: string, id: string): Promise<AnalysisDetailRow | null> {
  const prisma = getPrisma();
  const row = await prisma.analysis.findFirst({ where: { id, ownerHash } });
  if (!row) return null;
  return { ...toSummary(row), payload: row.payload as unknown as Analysis };
}

export async function updateAnalysis(
  ownerHash: string,
  id: string,
  patch: { notas?: string | null; revisado?: boolean },
): Promise<AnalysisDetailRow> {
  const prisma = getPrisma();
  const row = await prisma.analysis.update({
    where: { id, ownerHash },
    data: patch,
  });
  return { ...toSummary(row), payload: row.payload as unknown as Analysis };
}

export async function deleteAnalysis(ownerHash: string, id: string): Promise<boolean> {
  const prisma = getPrisma();
  const result = await prisma.analysis.deleteMany({ where: { id, ownerHash } });
  return result.count > 0;
}

/**
 * Borra todos los datos del espacio de trabajo (análisis y sitios) en una
 * transacción. El orden respeta la FK Restrict de Analysis → Site.
 * Solo afecta filas cuyo ownerHash coincide: nunca datos de otro espacio.
 */
export async function deleteWorkspaceData(ownerHash: string): Promise<{ analyses: number; sites: number }> {
  const prisma = getPrisma();
  const [analyses, sites] = await prisma.$transaction([
    prisma.analysis.deleteMany({ where: { ownerHash } }),
    prisma.site.deleteMany({ where: { ownerHash } }),
  ]);
  return { analyses: analyses.count, sites: sites.count };
}
