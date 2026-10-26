import { getPrisma } from "@/lib/db";
import type { SiteCreateInput, SiteUpdateInput } from "@/lib/contracts";
import type { Site } from "@/lib/services/sites.service";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE DATOS · repositorio de sites
   Único archivo que consulta la tabla sites. No hay reglas de
   negocio aquí: solo acceso y mapeo de datos.
   ═══════════════════════════════════════════════════════════════ */

export interface SiteRaw {
  id: string;
  url: string;
  nombre: string | null;
  notas: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { analyses: number };
}

export type SiteErrors = "NOT_FOUND" | "URL_DUPLICADA" | "TIENE_ANALISIS";

export function fromRaw(row: SiteRaw): Site {
  return {
    id: row.id,
    url: row.url,
    nombre: row.nombre,
    notas: row.notas,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row._count ? { analysisCount: row._count.analyses } : {}),
  };
}

const SELECT = { id: true, url: true, nombre: true, notas: true, createdAt: true, updatedAt: true }

export async function listSites(): Promise<Site[]> {
  const prisma = getPrisma();
  const rows = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    select: { ...SELECT, _count: { select: { analyses: true } } },
  });
  return rows.map(fromRaw);
}

export async function getSite(id: string): Promise<Site | null> {
  const prisma = getPrisma();
  const row = await prisma.site.findUnique({
    where: { id },
    select: { ...SELECT, _count: { select: { analyses: true } } },
  });
  return row ? fromRaw(row) : null;
}

export async function createSite(data: SiteCreateInput): Promise<Site> {
  const prisma = getPrisma();
  const row = await prisma.site.create({
    data: { url: data.url, nombre: data.nombre ?? null, notas: data.notas ?? null },
    select: { ...SELECT, _count: { select: { analyses: true } } },
  });
  return fromRaw(row);
}

export async function updateSite(id: string, patch: SiteUpdateInput): Promise<Site> {
  const prisma = getPrisma();
  const data: Record<string, unknown> = {};
  if (patch.url !== undefined) data.url = patch.url;
  if (patch.nombre !== undefined) data.nombre = patch.nombre;
  if (patch.notas !== undefined) data.notas = patch.notas;
  const row = await prisma.site.update({
    where: { id },
    data,
    select: { ...SELECT, _count: { select: { analyses: true } } },
  });
  return fromRaw(row);
}

export async function deleteSite(id: string): Promise<boolean> {
  const prisma = getPrisma();
  try {
    await prisma.site.delete({ where: { id } });
    return true;
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2025") return false; // no existe
    if (e.code === "P2003") throw "TIENE_ANALISIS" as SiteErrors; // FK restrict
    throw err;
  }
}
