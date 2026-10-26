import type { Analysis } from "@/lib/contracts";
import { getPrisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE DATOS · repositorio de analyses
   Único archivo que consulta la tabla analyses. Los listados no
   devuelven payload (pesado); el detalle sí.
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
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function createAnalysis(input: {
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
      url: input.url,
      score: Math.round(input.score),
      riskLevel: input.riskLevel ?? null,
      payload: input.payload as unknown as object,
      siteId: input.siteId ?? null,
    },
  });
  return { ...toSummary(row), payload: input.payload };
}

export async function listAnalyses(opts?: { limit?: number; siteId?: string }): Promise<AnalysisSummary[]> {
  const prisma = getPrisma();
  const rows = await prisma.analysis.findMany({
    where: opts?.siteId ? { siteId: opts.siteId } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    select: SUMMARY_SELECT,
  });
  return rows.map(toSummary);
}

export async function getAnalysis(id: string): Promise<AnalysisDetailRow | null> {
  const prisma = getPrisma();
  const row = await prisma.analysis.findUnique({ where: { id } });
  if (!row) return null;
  return { ...toSummary(row), payload: row.payload as unknown as Analysis };
}

export async function updateAnalysis(
  id: string,
  patch: { notas?: string | null; revisado?: boolean },
): Promise<AnalysisDetailRow> {
  const prisma = getPrisma();
  const row = await prisma.analysis.update({ where: { id }, data: patch });
  return { ...toSummary(row), payload: row.payload as unknown as Analysis };
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const prisma = getPrisma();
  try {
    await prisma.analysis.delete({ where: { id } });
    return true;
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2025") return false;
    throw err;
  }
}
