"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {  ArrowRight,
  ArrowRightLeft,
  ChevronDown,
  ClipboardCopy,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Printer,
  Radar,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Analysis, Evidence, Finding } from "@/lib/contracts";
import { consultarInforme } from "@/lib/api-client";
import { FRAMEWORKS } from "@/lib/frameworks";
import { copyToClipboard, downloadText, toMarkdown } from "@/lib/export";
import {
  formatBytes,
  formatDate,
  formatMs,
  riesgoPillTone,
  scoreTone,
  severityLabels,
  statusLabels,
  statusTone,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EmptyState, LinkBtn, Meter, Pill, Tabs } from "@/components/ui";
import { AsistenteIA } from "@/components/asistente-ia";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "hallazgos", label: "Hallazgos" },
  { id: "evidencias", label: "Evidencias" },
  { id: "plan", label: "Plan de acción" },
  { id: "normativa", label: "Normativa" },
];

const urgenciaTxt: Record<string, string> = {
  inmediata: "Inmediata",
  "30_dias": "30 días",
  "90_dias": "90 días",
  continua: "Continua",
};
const urgenciaTone: Record<string, string> = {
  inmediata: "pill-crit",
  "30_dias": "pill-high",
  "90_dias": "pill-med",
  continua: "pill-neutral",
};

export default function InformePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [tab, setTab] = useState("resumen");
  const [hallazgoDestacado, setHallazgoDestacado] = useState<{ id: string; n: number } | null>(null);

  const [respuesta, setRespuesta] = useState<{ id: string; result: Awaited<ReturnType<typeof consultarInforme>> }>();
  const result = respuesta?.id === id ? respuesta.result : undefined;
  const remota = result?.status === "ok" ? result.analysis : undefined;
  const necesitaRemota = /^PS-[A-Z0-9]{6}$/.test(id);
  useEffect(() => {
    if (!necesitaRemota) return;
    let vivo = true;
    consultarInforme(id).then((data) => { if (vivo) setRespuesta({ id, result: data }); });
    return () => { vivo = false; };
  }, [necesitaRemota, id]);

  // Normaliza colecciones opcionales antes de renderizar. Un payload antiguo o
  // incompleto no debe romper toda la vista al ejecutar .filter()/.map().
  const analysis = remota?.dataMode === "live"
    ? ({
        ...remota,
        accessibility: {
          reachable: Boolean(remota.accessibility?.reachable),
          finalUrl: remota.accessibility?.finalUrl ?? null,
          httpStatus: remota.accessibility?.httpStatus ?? null,
          durationMs: remota.accessibility?.durationMs ?? null,
          responseBytes: remota.accessibility?.responseBytes ?? null,
          redirects: Array.isArray(remota.accessibility?.redirects) ? remota.accessibility.redirects : [],
        },
        input: {
          ...remota.input,
          url: remota.input?.url ?? "",
          host: remota.input?.host ?? remota.input?.url ?? "Sitio analizado",
          frameworkIds: Array.isArray(remota.input?.frameworkIds) ? remota.input.frameworkIds : [],
        },
        dimensions: Array.isArray(remota.dimensions) ? remota.dimensions : [],
        evidence: Array.isArray(remota.evidence) ? remota.evidence : [],
        findings: Array.isArray(remota.findings)
          ? remota.findings.filter((item) => item && typeof item === "object").map((item) => ({
              ...item,
              id: typeof item.id === "string" ? item.id : "F-SIN-ID",
              title: typeof item.title === "string" ? item.title : "Hallazgo sin título",
              evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds : [],
              frameworks: Array.isArray(item.frameworks) ? item.frameworks : [],
            }))
          : [],
        recommendations: Array.isArray(remota.recommendations)
          ? remota.recommendations.filter((item) => item && typeof item === "object")
          : [],
        engineNotes: Array.isArray(remota.engineNotes) ? remota.engineNotes : [],
      } as Analysis)
    : undefined;

  if (necesitaRemota && result === undefined) {
    return (
      <div className="grid gap-4" role="status" aria-label="Cargando informe">
        <div className="skeleton h-28" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title={result?.status === "error" ? "No se pudo consultar el informe" : "Informe no disponible"}
        text={result?.status === "error" ? "Recarga la página para volver a consultar el servidor." : "El informe no está disponible en este espacio de trabajo."}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <LinkBtn href="/app/historial" variant="ghost" size="sm">Ver historial</LinkBtn>
            <LinkBtn href="/app/nuevo" size="sm"><Radar className="h-3.5 w-3.5" />Nuevo análisis</LinkBtn>
          </div>
        }
      />
    );
  }

  const fFilter = analysis.findings.filter((f) => !f.title.startsWith("Observación positiva"));
  const worst = { critico: 0, alto: 0, medio: 0, bajo: 0 } as Record<Finding["severity"], number>;
  for (const f of fFilter) worst[f.severity] += 1;

  return (
    <div className="report-print-root grid min-w-0 grid-cols-1 gap-6">
      {/* ── Cabecera del informe ── */}
      <header className="card p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="pill-low"><ShieldCheck className="h-3 w-3" />Análisis real</Pill>
              <span className="code">{analysis.id}</span>
              <span className="text-[12px] text-muted">{formatDate(analysis.createdAt)}</span>
              <span className="pill pill-demo">Motor {analysis.engineVersion}</span>
            </div>
            <h1 className="mt-3 font-disp text-[22px] font-semibold tracking-tight">{analysis.input.host}</h1>
            <a href={analysis.accessibility.finalUrl ?? analysis.input.url} target="_blank" rel="noreferrer noopener" className="mt-0.5 inline-flex max-w-full items-center gap-1.5 break-all text-[12.5px] text-muted hover:text-ink">
              {analysis.input.url} <ExternalLink className="h-3 w-3 flex-none" />
            </a>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="tag">HTTP {analysis.accessibility.httpStatus ?? "—"}</span>
              <span className="tag">{formatMs(analysis.accessibility.durationMs)}</span>
              <span className="tag">{formatBytes(analysis.accessibility.responseBytes ?? 0)} leídos</span>
              <span className="tag">
                {analysis.accessibility.redirects.length === 0
                  ? "sin redirecciones usadas"
                  : `${analysis.accessibility.redirects.length} redirección(es) validada(s)`}
              </span>
              <span className="tag">{analysis.findings.length} hallazgos</span>
              <span className="tag">{analysis.evidence.length} evidencias</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-disp text-5xl font-semibold tracking-tight tnum">{analysis.score}</p>
            <p className="text-[11.5px] text-muted">Privacy Score · sobre 100</p>
            <div className="mt-1.5 flex justify-end">
              <Pill tone={scoreTone(analysis.score)} className="text-[12px]">
                {analysis.score >= 80 ? "Aceptable" : analysis.score >= 60 ? "Mejorable" : analysis.score >= 40 ? "Deficiente" : "Crítico"}
              </Pill>
            </div>
            {analysis.riskLevel ? (
              <div className="mt-2 flex justify-end"><Pill tone={riesgoPillTone[analysis.riskLevel]}>Riesgo {severityLabels[analysis.riskLevel].toLowerCase()}</Pill></div>
            ) : null}
          </div>
        </div>

        {/* Exportar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line-soft pt-5 no-print">
          <button onClick={() => window.print()} className="btn btn-ghost btn-sm"><Printer className="h-3.5 w-3.5" />Imprimir / PDF</button>
          <button onClick={() => downloadText(`${analysis.id}-informe.md`, toMarkdown(analysis))} className="btn btn-ghost btn-sm"><FileDown className="h-3.5 w-3.5" />Descargar .md</button>
          <button onClick={() => downloadText(`${analysis.id}-analisis.json`, JSON.stringify(analysis, null, 2), "application/json")} className="btn btn-ghost btn-sm"><Download className="h-3.5 w-3.5" />JSON</button>
          <CopyBtn text={toMarkdown(analysis)} />
          <LinkBtn href={`/app/nuevo?url=${encodeURIComponent(analysis.input.url)}`} size="sm" className="ml-auto">Re-analizar</LinkBtn>
        </div>
      </header>

      <section className="report-cover card overflow-hidden p-6 md:p-8" aria-label="Ficha ejecutiva del informe">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="eyebrow">Informe de inteligencia de privacidad</p>
            <h2 className="mt-2 font-disp text-2xl font-semibold tracking-tight md:text-3xl">{analysis.input.host}</h2>
            <p className="mt-2 max-w-3xl break-all text-sm text-muted">{analysis.input.url}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tag">ID {analysis.id}</span><span className="tag">{formatDate(analysis.createdAt)}</span>
              <span className="tag">Motor {analysis.engineVersion}</span>
              <span className="tag">{analysis.dataMode === "live" ? "Análisis real" : "Muestra ilustrativa"}</span>
            </div>
          </div>
          <div className="report-score-panel rounded-2xl bg-[color:var(--c-bosque-soft)] px-6 py-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Privacy Score</p>
            <p className="mt-1 font-disp text-5xl font-semibold tracking-tight tnum">{analysis.score}<span className="text-xl text-muted">/100</span></p>
            <p className="mt-1 text-xs text-muted">Resultado del motor</p>
          </div>
        </div>
        {analysis.dataMode === "sample" ? <p className="mt-5 rounded-xl border border-[color:var(--c-risk-med)] bg-[color:var(--c-risk-med-soft)] p-3 text-sm">Esta es una muestra ilustrativa. No representa resultados reales del sitio indicado.</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line-soft pt-5 md:grid-cols-4">
          <div><p className="text-xs text-muted">Cobertura evaluada</p><p className="mt-1 text-2xl font-semibold tnum">{Math.round(analysis.dimensions.filter((d) => d.evaluated).reduce((sum, d) => sum + d.weight, 0) * 100)}%</p></div>
          <div><p className="text-xs text-muted">Dimensiones evaluadas</p><p className="mt-1 text-2xl font-semibold tnum">{analysis.dimensions.filter((d) => d.evaluated).length}<span className="text-sm text-muted">/{analysis.dimensions.length}</span></p></div>
          <div><p className="text-xs text-muted">Hallazgos</p><p className="mt-1 text-2xl font-semibold tnum">{analysis.findings.length}</p></div>
          <div><p className="text-xs text-muted">Evidencias</p><p className="mt-1 text-2xl font-semibold tnum">{analysis.evidence.length}</p></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">La cobertura indica qué proporción del peso de las dimensiones pudo evaluarse. No equivale al Privacy Score ni representa por sí sola el nivel de riesgo. Las conclusiones se limitan a las evidencias registradas en esta ejecución.</p>
      </section>

      <Tabs
        tabs={TABS.map((t) => ({
          ...t,
          badge: t.id === "hallazgos" ? <span className="code">{analysis.findings.length}</span> : t.id === "evidencias" ? <span className="code">{analysis.evidence.length}</span> : undefined,
        }))}
        active={tab}
        onChange={setTab}
      />

      <div role="tabpanel" id="tab-panel-resumen" aria-labelledby="tab-tab-resumen" tabIndex={0} hidden={tab !== "resumen"} className="focus-visible:outline-none">
        <Resumen a={analysis} worst={worst} />
      </div>
      <div role="tabpanel" id="tab-panel-hallazgos" aria-labelledby="tab-tab-hallazgos" tabIndex={0} hidden={tab !== "hallazgos"} className="focus-visible:outline-none">
        <Hallazgos a={analysis} destacado={hallazgoDestacado} />
      </div>
      <div role="tabpanel" id="tab-panel-evidencias" aria-labelledby="tab-tab-evidencias" tabIndex={0} hidden={tab !== "evidencias"} className="focus-visible:outline-none">
        <Evidencias a={analysis} />
      </div>
      <div role="tabpanel" id="tab-panel-plan" aria-labelledby="tab-tab-plan" tabIndex={0} hidden={tab !== "plan"} className="focus-visible:outline-none">
        <Plan
          a={analysis}
          onVerHallazgo={(fid) => {
            setHallazgoDestacado({ id: fid, n: Date.now() });
            setTab("hallazgos");
          }}
        />
      </div>
      <div role="tabpanel" id="tab-panel-normativa" aria-labelledby="tab-tab-normativa" tabIndex={0} hidden={tab !== "normativa"} className="focus-visible:outline-none">
        <Normativa a={analysis} />
      </div>

      <AsistenteIA key={analysis.id} analysis={remota ?? undefined} className="no-print" />
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => setOk(await copyToClipboard(text))}
      className="btn btn-ghost btn-sm"
    >
      <ClipboardCopy className="h-3.5 w-3.5" />{ok ? "¡Copiado!" : "Copiar Markdown"}
    </button>
  );
}

/* ── Resumen ejecutivo ── */
function Resumen({ a, worst }: { a: Analysis; worst: Record<string, number> }) {
  const evaluated = a.dimensions.filter((d) => d.evaluated);
  const contribution = evaluated.reduce((sum, d) => sum + d.value * d.weight, 0);
  const coverage = evaluated.reduce((sum, d) => sum + d.weight, 0);
  const top = a.recommendations.filter((r) => !r.id.startsWith("R-M")).slice(0, 3);
  return (
    <div className="grid gap-5">
      <section className="card p-6">
        <p className="eyebrow">Resumen ejecutivo</p>
        <p className="mt-3 text-[14.5px] leading-7">
          El análisis de <strong>{a.input.host}</strong> observó <strong>{a.evidence.length} evidencias</strong> y generó{" "}
          <strong>{a.findings.length} hallazgos</strong>
          {worst.critico > 0 ? ` (incluye ${worst.critico} crítico)` : worst.alto > 0 ? ` (incluye ${worst.alto} de severidad alta)` : ""}
          , con un Privacy Score de <strong>{a.score}/100</strong> calculado por una fórmula documentada y reproducible.
          {top.length > 0 ? <> La prioridad inicial del plan de acción: <strong>{top[0].title.toLowerCase()}</strong>.</> : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["critico", "alto", "medio", "bajo"] as const).map((s) =>
            worst[s] > 0 ? (
              <Pill key={s} tone={riesgoPillTone[s]}>{worst[s]} × severidad {severityLabels[s].toLowerCase()}</Pill>
            ) : null,
          )}
        </div>
      </section>

      <section className="card p-6">
        <p className="eyebrow">Score por dimensiones</p>
        <div className="mt-5 grid gap-3">
          {a.dimensions.map((d) => (
            <div key={d.id} className="grid sm:grid-cols-[minmax(150px,220px)_1fr_46px] gap-2 items-center">
              <div>
                <p className={cn("text-[13px] font-medium", !d.evaluated && "text-muted opacity-60")}>{d.label}</p>
                <p className="text-[10.5px] text-muted">{d.evaluated ? "Peso" : "Sin evaluación · peso declarado"} {Math.round(d.weight * 100)} %</p>
              </div>
              <div>
                {d.evaluated ? <Meter value={d.value} sm /> : null}
                <p className="mt-1 text-[10.5px] text-muted">{d.note}</p>
              </div>
              <span className="tnum text-right text-[13px] font-semibold">{d.evaluated ? d.value : "n/e"}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-xl bg-[color:var(--c-marfil)] p-3.5 text-[11.5px] leading-5 text-muted">
          El puntaje es la suma de cada valor por su peso, dividida por el peso evaluado.
          {coverage > 0 ? <> En este informe: {contribution.toFixed(2)} ÷ {coverage.toFixed(2)} = {Math.round(contribution / coverage)}/100 (redondeado).</> : null}
          {" "}Cobertura por pesos: {Math.round(coverage * 100)} %. La severidad describe los hallazgos; puede ser alta aunque el promedio sea favorable. El resultado orienta una revisión técnica acotada.
        </p>
      </section>

      <section className="card p-6">
        <p className="eyebrow flex items-center gap-2"><TriangleAlert className="h-3.5 w-3.5" />Limitaciones declaradas del análisis</p>
        <ul className="mt-3 grid gap-2">
          {a.engineNotes.map((n, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-6 text-muted">
              <span className="mt-2.5 h-1 w-1 flex-none rounded-full bg-[color:var(--c-muted)]" />{n}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ── Hallazgos ── */
function Hallazgos({ a, destacado }: { a: Analysis; destacado: { id: string; n: number } | null }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("todos");
  const [severity, setSeverity] = useState("todas");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!destacado) return;
    setOpen((prev) => new Set(prev).add(destacado.id));
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`finding-${destacado.id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [destacado]);

  const filtered = a.findings.filter(
    (f) =>
      (status === "todos" || f.status === status) &&
      (severity === "todas" || f.severity === severity) &&
      (!query || `${f.id} ${f.title}`.toLowerCase().includes(query.toLowerCase())),
  );

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="buscar-hallazgo" className="sr-only">Buscar hallazgo por identificador o título</label>
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="buscar-hallazgo" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar hallazgo…" className="input pl-9" type="search" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-auto" aria-label="Filtro por estado">
          <option value="todos">Todos los estados</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="select w-auto" aria-label="Filtro por severidad">
          <option value="todas">Todas las severidades</option>
          {(["critico", "alto", "medio", "bajo"] as const).map((s) => <option key={s} value={s}>{severityLabels[s]}</option>)}
        </select>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {filtered.length} hallazgo(s) coinciden con los filtros actuales.
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={<Radar className="h-5 w-5" />} title="Sin hallazgos para este filtro" text="Prueba con otros filtros o revisa la pestaña de evidencias." />
      ) : (
        filtered.map((f) => <FindingCard key={f.id} f={f} a={a} open={open.has(f.id)} toggle={() => toggle(f.id)} />)
      )}
    </div>
  );
}

function FindingCard({ f, a, open, toggle }: { f: Finding; a: Analysis; open: boolean; toggle: () => void }) {
  return (
    <article id={`finding-${f.id}`} tabIndex={-1} aria-label={`Hallazgo ${f.id}: ${f.title}`} className="card overflow-hidden p-0 scroll-mt-24 focus-visible:outline-none">
      <button onClick={toggle} className="flex w-full flex-wrap items-center gap-3 p-5 text-left" aria-expanded={open} aria-controls={`finding-body-${f.id}`}>
        <span className="code flex-none">{f.id}</span>
        <Pill tone={statusTone[f.status]} className="flex-none">{statusLabels[f.status]}</Pill>
        <Pill tone={riesgoPillTone[f.severity]} className="flex-none">{severityLabels[f.severity]}</Pill>
        <span className="pill pill-neutral flex-none">{f.priority}</span>
        <span className="min-w-0 flex-1 truncate font-disp text-[14.5px] font-semibold">{f.title}</span>
        <ChevronDown className={cn("h-4 w-4 flex-none text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <div id={`finding-body-${f.id}`} className="border-t border-line-soft p-5 pt-4">
          <p className="text-[13.5px] leading-6">{f.explanation}</p>
          <div className="mt-4 grid gap-3 text-[12.5px] leading-5 text-muted">
            <p><span className="font-semibold text-ink">Impacto de negocio:</span> {f.businessImpact}</p>
            <div>
              <span className="font-semibold text-ink">Evidencia ({f.evidenceIds.length}):</span>
              <div className="mt-2 grid gap-2">
                {f.evidenceIds.map((id) => {
                  const ev = a.evidence.find((e) => e.id === id);
                  if (!ev) return null;
                  return (
                    <div key={id} className="rounded-xl bg-[color:var(--c-code-bg)] p-3">
                      <p className="code text-[11px]">{id} · {ev.title}</p>
                      <p className="mt-1 break-all">{ev.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {f.frameworks.length > 0 ? (
              <div>
                <span className="font-semibold text-ink">Relación normativa (indicativa):</span>
                <ul className="mt-2 grid gap-1.5">
                  {f.frameworks.map((fr, i) => (
                    <li key={i} className="rounded-xl bg-[color:var(--c-bosque-soft)] p-3 text-[12.5px] leading-5">
                      <strong className="text-bosque">{FRAMEWORKS[fr.id]?.nombre ?? fr.id}</strong> · {fr.ref}
                      <p className="mt-1 text-muted">{fr.relation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex items-start gap-2.5 rounded-xl bg-[color:var(--c-menta-soft)] p-3.5 text-[13px] leading-6 text-ink">
              <ArrowRightLeft className="mt-1 h-4 w-4 flex-none text-bosque" />
              <p><span className="font-semibold text-bosque">Recomendación:</span> {f.recommendation}</p>
            </div>
            {f.limitation ? (
              <p className="rounded-xl border border-dashed border-line p-3 text-[11.5px] leading-5">
                <strong>Limitación:</strong> {f.limitation}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* ── Evidencias ── */
function Evidencias({ a }: { a: Analysis }) {
  const kindTxt: Record<Evidence["kind"], string> = {
    http: "Solicitud HTTP",
    header: "Cabecera",
    cookie: "Cookie",
    html: "Contenido HTML",
    dns: "DNS",
    robots: "robots.txt",
    sistema: "Sistema",
  };
  return (
    <div className="grid gap-3">
      <p className="text-[12.5px] text-muted">
        Cada hallazgo se apoya en una o más evidencias observadas por el motor con fecha y fuente. Las evidencias no
        interpretan la norma: registran lo que se observó en la corrida.
      </p>
      {a.evidence.map((e) => (
        <div key={e.id} className="card p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="code">{e.id}</span>
            <span className="tag tag-solid">{kindTxt[e.kind]}</span>
            <span className="ml-auto text-[11px] text-muted">{formatDate(e.observedAt)}</span>
          </div>
          <h3 className="mt-2.5 font-disp text-[14.5px] font-semibold">{e.title}</h3>
          <p className="mt-1.5 break-all text-[13px] leading-6 text-muted">{e.detail}</p>
          {/^https?:\/\//.test(e.source) ? (
            <a href={e.source} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-[11.5px] text-bosque">
              {e.source} <ExternalLink className="h-3 w-3 flex-none" />
            </a>
          ) : (
            <p className="mt-2 text-[11.5px] text-muted">fuente: {e.source}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Plan de acción ── */
function Plan({ a, onVerHallazgo }: { a: Analysis; onVerHallazgo: (id: string) => void }) {
  const groups: Array<{ key: string; label: string }> = [
    { key: "inmediata", label: "Inmediato" },
    { key: "30_dias", label: "Próximos 30 días" },
    { key: "90_dias", label: "Próximos 90 días" },
    { key: "continua", label: "Mejora continua" },
  ];
  if (a.recommendations.length === 0) {
    return <EmptyState icon={<ArrowRightLeft className="h-5 w-5" />} title="Sin acciones en el plan" text="Este informe no generó recomendaciones pendientes." />;
  }
  return (
    <div className="grid gap-5">
      <p className="text-[12.5px] text-muted">
        Acciones ordenadas por urgencia declarada. El impacto/urgencia se deriva de la severidad de la evidencia; el
        esfuerzo es una estimación genérica que convendrá ajustar con el equipo técnico.
      </p>
      {groups.map((g) => {
        const items = a.recommendations.filter((r) => r.urgencia === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="grid gap-3">
            <h3 className="font-disp text-[15.5px] font-semibold">{g.label} <span className="text-muted">({items.length})</span></h3>
            {items.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="code">{r.id}</span>
                  <Pill tone={urgenciaTone[r.urgencia]}>{urgenciaTxt[r.urgencia]}</Pill>
                  <span className="tag">Impacto {r.impact}</span>
                  <span className="tag">Esfuerzo {r.effort}</span>
                  {r.relatedFindingId ? (
                    <button
                      type="button"
                      onClick={() => onVerHallazgo(r.relatedFindingId!)}
                      className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-bosque hover:underline"
                    >
                      Ver hallazgo {r.relatedFindingId} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                <h4 className="mt-3 font-disp text-[15px] font-semibold">{r.title}</h4>
                <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{r.action}</p>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/* ── Normativa vinculada ── */
function Normativa({ a }: { a: Analysis }) {
  return (
    <div className="grid gap-4">
      <p className="text-[12.5px] text-muted">
        Referencias oficiales de los marcos seleccionados y las disposiciones relacionadas con los hallazgos de este
        informe. PRIVACYOS relaciona la evidencia con obligaciones indicativas; la determinación del cumplimiento
        requiere asesoría jurídica.
      </p>
      {a.input.frameworkIds.map((fid) => {
        const meta = FRAMEWORKS[fid];
        if (!meta) return null;
        const refsUsadas = new Set(a.findings.flatMap((f) => f.frameworks.filter((fr) => fr.id === fid).map((fr) => fr.ref)));
        return (
          <section key={fid} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-disp text-lg font-semibold">{meta.nombre}</h3>
                <p className="text-[12px] text-muted">{meta.jurisdiccion}</p>
              </div>
              <Pill tone={meta.estado === "vigente" ? "pill-low" : "pill-med"}>{meta.statusLabel}</Pill>
            </div>
            {meta.temporalNote ? (
              <p className="mt-4 rounded-xl bg-[color:var(--c-risk-med-soft)] p-3.5 text-[12.5px] leading-5 text-[color:var(--c-risk-med)]">{meta.temporalNote}</p>
            ) : null}
            <p className="mt-4 text-[13px] leading-6 text-muted">{meta.applicability}</p>
            {refsUsadas.size > 0 ? (
              <div className="mt-4">
                <p className="label">Provisiones relacionadas en este informe</p>
                <ul className="grid gap-1.5 text-[13px]">
                  {[...refsUsadas].map((ref) => (
                    <li key={ref} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-bosque" />{ref}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={meta.officialRef} target="_blank" rel="noreferrer noopener" className="btn btn-ghost btn-sm">
                {meta.sourceLabel} <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <LinkBtn href="/app/regulatorio" variant="subtle" size="sm">Ver inteligencia regulatoria</LinkBtn>
            </div>
          </section>
        );
      })}
      <LinkBtn href="/app/derechos" variant="ghost" size="sm" className="justify-self-start">
        Centro de derechos de privacidad <ArrowRight className="h-3.5 w-3.5" />
      </LinkBtn>
    </div>
  );
}
