import type { Analysis } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════════
   ADAPTADOR de datos · cliente HTTP de la API REST (Hito 2)
   El frontend lee de la API real (Supabase vía rutas /api) y, si la
   API no responde, la app degrada al comportamiento del Hito 1
   (localStorage). Ninguna llamada a la base de datos ocurre en el
   navegador: siempre pasa por las rutas del servidor.
   ═══════════════════════════════════════════════════════════════ */

export interface AnalysisSummaryApi {
  id: string;
  url: string;
  score: number;
  riskLevel: string | null;
  notas: string | null;
  revisado: boolean;
  siteId: string | null;
  createdAt: string;
}

/** Convierte un resumen de la API en la forma parcial de Analysis que usan las tarjetas del historial. */
export function summaryAAnalisis(s: AnalysisSummaryApi): Analysis {
  let host = s.url;
  try { host = new URL(s.url).host; } catch { /* url atipica guardada */ }
  return {
    id: s.id,
    dataMode: "live",
    createdAt: s.createdAt,
    engineVersion: "servidor", // detalle disponible en el payload; el listado lo omite por diseño
    input: { url: s.url, host, frameworkIds: [] },
    accessibility: {
      reachable: true,
      finalUrl: s.url,
      httpStatus: null,
      durationMs: null,
      responseBytes: null,
      redirects: [],
    },
    dimensions: [],
    score: s.score,
    riskLevel: (s.riskLevel ?? null) as Analysis["riskLevel"],
    evidence: [],
    findings: [],
    recommendations: [],
    engineNotes: [],
  };
}

/** Lista los análisis persistidos en el servidor (null = API no disponible). */
export async function listarRemotos(): Promise<AnalysisSummaryApi[] | null> {
  try {
    const res = await fetch("/api/analyses?limit=50", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; analyses?: AnalysisSummaryApi[] };
    return data.ok && Array.isArray(data.analyses) ? data.analyses : null;
  } catch {
    return null;
  }
}

/** Detalle completo de un análisis servidor (payload con hallazgos y evidencias). */
export async function analisisRemoto(id: string): Promise<Analysis | null> {
  try {
    const res = await fetch(`/api/analyses/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; analysis?: { payload: Analysis } };
    return data.ok && data.analysis?.payload ? data.analysis.payload : null;
  } catch {
    return null;
  }
}

/** Elimina un análisis servidor (retorna null = API no disponible, true/false = resultado). */
export async function eliminarRemoto(id: string): Promise<boolean | null> {
  try {
    const res = await fetch(`/api/analyses/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.status === 204) return true;
    return false;
  } catch {
    return null;
  }
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  hint?: string;
}

/** POST /api/analyses: corre el motor REAL en el servidor y PERSISTE. Falla con el detalle del contrato del motor. */
export async function crearAnalisisServidor(input: {
  url: string;
  frameworkIds: string[];
  id?: string;
}): Promise<{ analysis: Analysis } | { error: ApiErrorBody; status: number }> {
  try {
    const res = await fetch("/api/analyses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      analysis?: Analysis;
      code?: string;
      message?: string;
      hint?: string;
    };
    if (res.status === 201 && data.ok && data.analysis) return { analysis: data.analysis };
    return { status: res.status, error: { code: data.code, message: data.message, hint: data.hint } };
  } catch (err) {
    return { status: 0, error: { code: "RED", message: "No se pudo contactar al servidor.", hint: (err as Error).message } };
  }
}
