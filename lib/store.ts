import type { FrameworkId, Preferences } from "./contracts";
import { preferencesSchema } from "./contracts";
import { safeLocalGet, safeLocalSet } from "./utils";

const PREFS_KEY = "privacyos.prefs.v1";

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

/* ── Contexto del análisis en curso, solo en memoria ── */
let pendingAnalysis: PendingAnalysis | null = null;

export interface PendingAnalysis {
  id: string;
  url: string;
  frameworkIds: FrameworkId[];
  siteId?: string;
}

export function setPendingAnalysis(p: PendingAnalysis): void {
  pendingAnalysis = p;
}

export function getPendingAnalysis(): PendingAnalysis | null {
  return pendingAnalysis;
}

export function clearPendingAnalysis(): void {
  pendingAnalysis = null;
}
