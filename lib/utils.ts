/** Utilidades compartidas. */

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export const severityLabels: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  critico: "Crítico",
};

export const statusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  posible: "Posible · requiere revisión",
  riesgo_tecnico: "Riesgo técnico observado",
  insuficiente: "Información insuficiente",
  preventivo: "Recomendación preventiva",
};

export const statusTone: Record<string, string> = {
  confirmado: "pill-crit",
  posible: "pill-high",
  riesgo_tecnico: "pill-med",
  insuficiente: "pill-neutral",
  preventivo: "pill-brand",
};

export const riesgoPillTone: Record<string, string> = {
  bajo: "pill-low",
  medio: "pill-med",
  alto: "pill-high",
  critico: "pill-crit",
};

export function scoreTone(score: number): string {
  if (score >= 80) return "pill-low";
  if (score >= 60) return "pill-med";
  if (score >= 40) return "pill-high";
  return "pill-crit";
}

export function shortId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PS-${out}`;
}

/** Envuelve el resultado de localStorage con manejo seguro (SSR-safe). */
export function safeLocalGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeLocalSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cuota llena: persistencia no disponible en este dispositivo */
  }
}
