import type { Analysis } from "@/lib/contracts";

// Las vistas consultan los datos del espacio de trabajo a través de la API REST.

/** Señal de aborto con límite de tiempo para que ninguna vista quede en carga infinita. */
function signalTiempo(ms: number): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return undefined;
  }
}

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
    const res = await fetch("/api/analyses?limit=50", { cache: "no-store", signal: signalTiempo(15_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; analyses?: AnalysisSummaryApi[] };
    return data.ok && Array.isArray(data.analyses) ? data.analyses : null;
  } catch {
    return null;
  }
}

export async function consultarInforme(id: string): Promise<
  { status: "ok"; analysis: Analysis } | { status: "missing" | "error" }
> {
  try {
    const res = await fetch(`/api/analyses/${encodeURIComponent(id)}`, { cache: "no-store", signal: signalTiempo(15_000) });
    if (res.status === 404) return { status: "missing" };
    if (!res.ok) return { status: "error" };

    const data = (await res.json()) as { ok: boolean; analysis?: { payload: Analysis } };
    if (!data.ok || !data.analysis?.payload) return { status: "error" };
    return { status: "ok", analysis: data.analysis.payload };
  } catch {
    return { status: "error" };
  }
}

export async function analisisRemoto(id: string): Promise<Analysis | null> {
  const result = await consultarInforme(id);
  return result.status === "ok" ? result.analysis : null;
}

/** Elimina un análisis servidor (retorna null = API no disponible, true/false = resultado). */
export async function eliminarRemoto(id: string): Promise<boolean | null> {
  try {
    const res = await fetch(`/api/analyses/${encodeURIComponent(id)}`, { method: "DELETE", signal: signalTiempo(15_000) });
    if (res.status === 204) return true;
    return false;
  } catch {
    return null;
  }
}

/**
 * Borra todo el espacio de trabajo del servidor (análisis y sitios).
 * Devuelve "ok", "sin-confirmar" (la API rechazó la operación),
 * "no-disponible" (red/base caída) o "error".
 */
export async function borrarEspacioRemoto(): Promise<"ok" | "sin-confirmar" | "no-disponible" | "error"> {
  try {
    const res = await fetch("/api/analyses", {
      method: "DELETE",
      headers: { "x-confirm-delete": "workspace" },
      signal: signalTiempo(20_000),
    });
    if (res.ok) return "ok";
    if (res.status === 503) return "no-disponible";
    if (res.status === 400 || res.status === 403) return "sin-confirmar";
    return "error";
  } catch {
    return "no-disponible";
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
  siteId?: string;
}): Promise<{ analysis: Analysis } | { error: ApiErrorBody; status: number }> {
  try {
    const res = await fetch("/api/analyses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: signalTiempo(40_000),
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
