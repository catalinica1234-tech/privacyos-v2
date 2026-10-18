import type { Analysis, FrameworkId, Preferences } from "./contracts";
import { preferencesSchema } from "./contracts";
import { safeLocalGet, safeLocalSet } from "./utils";

/* ═════════════════════════════════════════════════════════════════
   Persistencia local (Hito 1).
   El historial vive en localStorage del navegador del usuario:
   NO hay base de datos ni backend persistente, y ello se comunica
   de forma explícita en la interfaz. Preparado para migrar a
   servidor en Hito 2 cambiando únicamente este módulo.
   ═════════════════════════════════════════════════════════════════ */

const HISTORY_KEY = "privacyos.history.v1";
const PREFS_KEY = "privacyos.prefs.v1";
const MAX_HISTORY = 40;

export function getHistory(): Analysis[] {
  return safeLocalGet<Analysis[]>(HISTORY_KEY, []);
}

export function getAnalysis(id: string): Analysis | null {
  return getHistory().find((a) => a.id === id) ?? null;
}

export function saveAnalysis(analysis: Analysis): Analysis[] {
  const list = getHistory().filter((a) => a.id !== analysis.id);
  const next = [analysis, ...list].slice(0, MAX_HISTORY);
  safeLocalSet(HISTORY_KEY, next);
  return next;
}

export function deleteAnalysis(id: string): Analysis[] {
  const next = getHistory().filter((a) => a.id !== id);
  safeLocalSet(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): void {
  safeLocalSet(HISTORY_KEY, []);
}

export function latestLiveAnalysis(): Analysis | null {
  return getHistory().find((a) => a.dataMode === "live") ?? null;
}

export function latestSampleAnalysis(): Analysis | null {
  return getHistory().find((a) => a.dataMode === "sample") ?? null;
}

/* ── Preferencias ── */
export const defaultPreferences: Preferences = { theme: "system", contrast: "normal" };

export function getPreferences(): Preferences {
  const raw = safeLocalGet<Partial<Preferences>>(PREFS_KEY, {});
  const parsed = preferencesSchema.safeParse({ ...defaultPreferences, ...raw });
  return parsed.success ? parsed.data : defaultPreferences;
}

export function savePreferences(prefs: Preferences): void {
  safeLocalSet(PREFS_KEY, prefs);
}

/* ── Contexto del análisis en curso (pasa por URL entre pantallas) ── */
const PENDING_KEY = "privacyos.pending.v1";

export interface PendingAnalysis {
  id: string;
  url: string;
  frameworkIds: FrameworkId[];
}

export function setPendingAnalysis(p: PendingAnalysis): void {
  safeLocalSet(PENDING_KEY, p);
}

export function getPendingAnalysis(): PendingAnalysis | null {
  return safeLocalGet<PendingAnalysis | null>(PENDING_KEY, null);
}

export function clearPendingAnalysis(): void {
  safeLocalSet(PENDING_KEY, null);
}
