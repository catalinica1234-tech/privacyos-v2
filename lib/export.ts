import type { Analysis } from "./contracts";
import { FRAMEWORKS } from "./frameworks";
import { formatDate, severityLabels, statusLabels } from "./utils";

/* ═════════════════════════════════════════════════════════════════
   Exportación de informes (client-side, sin dependencias).
   ═════════════════════════════════════════════════════════════════ */

export function toMarkdown(a: Analysis): string {
  const L: string[] = [];
  L.push(`# Informe PRIVACYOS · ${a.input.host}`);
  L.push(`- Identificador: ${a.id}`);
  L.push(`- Fecha: ${formatDate(a.createdAt)}`);
  L.push(`- URL: ${a.input.url}`);
  L.push(`- Tipo: ${a.dataMode === "live" ? "Análisis real (motor " + a.engineVersion + ")" : "MUESTRA ILUSTRATIVA (no corresponde a resultados reales)"}`);
  L.push(`- Marcos seleccionados: ${a.input.frameworkIds.map((f) => FRAMEWORKS[f]?.nombre ?? f).join(", ")}`);
  L.push("");
  if (a.dataMode === "sample") {
    L.push("> AVISO: este documento es una muestra ilustrativa y no describe al sitio indicado.");
    L.push("");
  }
  L.push(`## Resumen`);
  L.push(`- HTTP final: ${a.accessibility.httpStatus ?? "—"} · ${a.accessibility.durationMs ?? "—"} ms · ${redirectsText(a.accessibility.redirects.length)}`);
  L.push(`- **Privacy Score: ${a.score}/100** · Riesgo: ${a.riskLevel ? severityLabels[a.riskLevel] : "—"}`);
  L.push("");
  L.push(`| Dimensión | Valor | Peso | Evaluada |`);
  L.push(`| --- | --- | --- | --- |`);
  for (const d of a.dimensions) {
    L.push(`| ${d.label} | ${d.evaluated ? d.value : "n/e"} | ${d.weight} | ${d.evaluated ? "sí" : "no"} |`);
  }
  L.push("");
  L.push(`## Hallazgos (${a.findings.length})`);
  for (const f of a.findings) {
    L.push(`### ${f.id} · ${f.title}`);
    L.push(`- Estado: ${statusLabels[f.status]} · Severidad: ${severityLabels[f.severity]} · Prioridad: ${f.priority}`);
    L.push(`- ${f.explanation}`);
    L.push(`- Impacto de negocio: ${f.businessImpact}`);
    L.push(`- Evidencia: ${f.evidenceIds.join(", ")}`);
    if (f.frameworks.length > 0) {
      for (const fr of f.frameworks) L.push(`- Relación normativa: ${FRAMEWORKS[fr.id]?.nombre ?? fr.id} — ${fr.ref} (${fr.relation})`);
    }
    L.push(`- Recomendación: ${f.recommendation}`);
    if (f.limitation) L.push(`- Limitación: ${f.limitation}`);
    L.push("");
  }
  L.push(`## Evidencias (${a.evidence.length})`);
  for (const e of a.evidence) {
    L.push(`- **${e.id}** [${e.kind}] ${e.title} — ${e.detail}`);
    L.push(`  - Fuente: ${e.source}`);
  }
  L.push("");
  L.push(`## Plan de acción`);
  const urgenciaTxt: Record<string, string> = {
    inmediata: "Inmediata",
    "30_dias": "30 días",
    "90_dias": "90 días",
    continua: "Continua",
  };
  for (const r of a.recommendations) {
    L.push(`- **${r.id}** [${urgenciaTxt[r.urgencia]}] ${r.title} — ${r.action}`);
  }
  L.push("");
  L.push(`## Limitaciones del análisis`);
  for (const n of a.engineNotes) L.push(`- ${n}`);
  L.push("");
  L.push(`_Informe generado por PRIVACYOS. Las observaciones corresponden a la fecha de ejecución y no constituyen un dictamen legal._`);
  return L.join("\n");
}

function redirectsText(n: number): string {
  return n === 0 ? "sin redirecciones usadas" : `${n} redirección(es) validada(s)`;
}

export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
