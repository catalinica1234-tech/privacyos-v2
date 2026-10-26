import type {
  SiteCreateInput,
  SiteUpdateInput,
} from "@/lib/contracts";
import {
  createSite,
  deleteSite,
  getSite,
  listSites,
  updateSite,
} from "@/lib/repositories/sites.repo";
import { ApiError } from "@/lib/services/errors";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE SERVICIO · reglas de negocio del recurso site
   Aquí vive la decisión: qué significa que una URL esté duplicada,
   qué se puede borrar y con qué consecuencia. Nada de HTTP ni SQL.
   ═══════════════════════════════════════════════════════════════ */

export type Site = {
  id: string;
  url: string;
  nombre: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  analysisCount?: number;
};

export async function listarSites(): Promise<Site[]> {
  return listSites();
}

export async function crearSite(input: SiteCreateInput): Promise<Site> {
  try {
    return await createSite(input);
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new ApiError(409, "CONFLICTO_URL", "Ya existe un sitio registrado con esa URL.", "Usa GET /api/sites para verlos.");
    }
    throw err;
  }
}

export async function obtenerSite(id: string): Promise<Site> {
  const site = await getSite(id);
  if (!site) {
    throw new ApiError(404, "NO_ENCONTRADO", `No existe un sitio con id ${id}.`, "Revisa GET /api/sites.");
  }
  return site;
}

export async function editarSite(id: string, patch: SiteUpdateInput): Promise<Site> {
  try {
    return await updateSite(id, patch);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new ApiError(404, "NO_ENCONTRADO", `No existe un sitio con id ${id}.`);
    }
    if ((err as { code?: string }).code === "P2002") {
      throw new ApiError(409, "CONFLICTO_URL", "Otro sitio ya usa esa URL.");
    }
    throw err;
  }
}

export async function eliminarSite(id: string): Promise<void> {
  let outcome: boolean | string;
  try {
    outcome = await deleteSite(id);
  } catch (err) {
    if (err === "TIENE_ANALISIS") {
      throw new ApiError(
        409,
        "CONFLICTO_BORRADO",
        "El sitio tiene análisis asociados: bórralos primero.",
        "La base protege las evidencias históricas (FK RESTRICT).",
      );
    }
    throw err;
  }
  if (outcome === false) {
    throw new ApiError(404, "NO_ENCONTRADO", `No existe un sitio con id ${id}.`);
  }
}
