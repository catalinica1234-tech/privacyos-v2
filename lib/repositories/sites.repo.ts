import { getPrisma } from "@/lib/db";
import type { SiteCreateInput, SiteUpdateInput } from "@/lib/contracts";
import type { Site } from "@/lib/services/sites.service";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE DATOS · repositorio de sites
   Único archivo que consulta la tabla sites. No hay reglas de
   negocio aquí: solo acceso y mapeo de datos. Todas las consultas
   filtran por ownerHash (aislamiento por espacio de trabajo).
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

const SELECT = { id: true, url: true, nombre: true, notas: true, createdAt: true, updatedAt: true };

export async function listSites(ownerHash: string): Promise<Site[]> {
  const prisma = getPrisma();
  const rows = await prisma.site.findMany({
    where: { ownerHash },
    orderBy: { createdAt: "desc" },
    select: { ...SELECT, _count: { select: { analyses: { where: { ownerHash } } } } },
  });
  return rows.map(fromRaw);
}

export async function getSite(ownerHash: string, id: string): Promise<Site | null> {
  const prisma = getPrisma();
  const row = await prisma.site.findFirst({
    where: { id, ownerHash },
    select: { ...SELECT, _count: { select: { analyses: { where: { ownerHash } } } } },
  });
  return row ? fromRaw(row) : null;
}

export async function createSite(ownerHash: string, data: SiteCreateInput): Promise<Site> {
  const prisma = getPrisma();
  const row = await prisma.site.create({
    data: { ownerHash, url: data.url, nombre: data.nombre ?? null, notas: data.notas ?? null },
    select: { ...SELECT, _count: { select: { analyses: { where: { ownerHash } } } } },
  });
  return fromRaw(row);
}

export async function updateSite(ownerHash: string, id: string, patch: SiteUpdateInput): Promise<Site> {
  const prisma = getPrisma();
  const data: Record<string, unknown> = {};
  if (patch.url !== undefined) data.url = patch.url;
  if (patch.nombre !== undefined) data.nombre = patch.nombre;
  if (patch.notas !== undefined) data.notas = patch.notas;
  const row = await prisma.site.update({
    where: { id, ownerHash },
    data,
    select: { ...SELECT, _count: { select: { analyses: { where: { ownerHash } } } } },
  });
  return fromRaw(row);
}

export async function deleteSite(ownerHash: string, id: string): Promise<boolean> {
  const prisma = getPrisma();
  try {
    const result = await prisma.site.deleteMany({ where: { id, ownerHash } });
    return result.count > 0;
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2003") throw "TIENE_ANALISIS" as SiteErrors; // FK restrict
    throw err;
  }
}
