"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Archive, FileText, PlayCircle, Radar, Sparkles, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Analysis } from "@/lib/contracts";
import { getHistory, latestLiveAnalysis } from "@/lib/store";
import { formatDate, severityLabels, riesgoPillTone, scoreTone } from "@/lib/utils";
import { EmptyState, LinkBtn, Meter, Pill } from "@/components/ui";

export default function DashboardPage() {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setReady(true);
  }, []);

  const lastLive = latestLiveAnalysis();
  const recent = history.slice(0, 5);
  const riskCount = lastLive
    ? lastLive.findings.filter((f) => !f.title.startsWith("Observación positiva")).length
    : 0;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Panel</p>
          <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Tu privacidad, de un vistazo</h1>
        </div>
        <div className="flex gap-2">
          <LinkBtn href="/app/nuevo" size="sm"><Radar className="h-3.5 w-3.5" />Nuevo análisis</LinkBtn>
          <LinkBtn href="/app/historial" variant="ghost" size="sm"><Archive className="h-3.5 w-3.5" />Historial</LinkBtn>
        </div>
      </header>

      {!ready ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      ) : lastLive ? (
        <>
          {/* Resumen del último análisis real */}
          <section className="card p-6 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <Pill tone="pill-low"><ShieldCheck className="h-3 w-3" />Análisis real</Pill>
                  <span className="text-[12px] text-muted">{formatDate(lastLive.createdAt)}</span>
                </div>
                <h2 className="mt-3 font-disp text-xl font-semibold tracking-tight">{lastLive.input.host}</h2>
                <p className="mt-1 text-[12.5px] text-muted">{lastLive.input.url}</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="font-disp text-5xl font-semibold tracking-tight tnum">{lastLive.score}</p>
                  <p className="text-[11px] text-muted">Privacy Score · sobre 100</p>
                </div>
                <Pill tone={riesgoPillTone[lastLive.riskLevel ?? "medio"]} className="self-start">
                  Riesgo {severityLabels[lastLive.riskLevel ?? "medio"].toLowerCase()}
                </Pill>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-x-10">
              {lastLive.dimensions.map((d) => (
                <div key={d.id} className="grid grid-cols-[minmax(150px,190px)_1fr_40px] items-center gap-3">
                  <span className={`text-[12.5px] ${d.evaluated ? "text-muted" : "text-muted opacity-60"}`}>
                    {d.label}{!d.evaluated ? " · n/e" : ""}
                  </span>
                  <Meter value={d.value} sm />
                  <span className="tnum text-right text-[12px] font-medium">{d.evaluated ? d.value : "—"}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LinkBtn href={`/app/informe/${lastLive.id}`} size="sm">
                <FileText className="h-3.5 w-3.5" />Abrir informe completo
              </LinkBtn>
              <LinkBtn href={`/app/nuevo?url=${encodeURIComponent(lastLive.input.url)}`} variant="subtle" size="sm">
                Re-analizar este sitio
              </LinkBtn>
              <span className="text-[12px] text-muted">{riskCount} hallazgos priorizados en el informe</span>
            </div>
          </section>

          {/* Recientes */}
          <section className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-disp text-lg font-semibold">Análisis recientes</h2>
              <Link href="/app/historial" className="inline-flex items-center gap-1 text-[13px] font-semibold text-bosque">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="card divide-y divide-line-soft overflow-hidden p-0">
              {recent.map((a) => (
                <Link
                  key={a.id}
                  href={`/app/informe/${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-[color:var(--c-marfil)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {a.dataMode === "live"
                      ? <ShieldCheck className="h-4 w-4 flex-none text-menta" />
                      : <PlayCircle className="h-4 w-4 flex-none text-muted" />}
                    <div className="min-w-0">
                      <p className="truncate font-disp text-[14px] font-semibold">{a.input.host}</p>
                      <p className="text-[11.5px] text-muted">{formatDate(a.createdAt)} · {a.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.dataMode === "sample" ? <Pill tone="pill-sample">MUESTRA ILUSTRATIVA</Pill> : null}
                    <Pill tone={riesgoPillTone[a.riskLevel ?? "bajo"]}>{severityLabels[a.riskLevel ?? "bajo"]}</Pill>
                    <Pill tone={scoreTone(a.score)}>{a.score}</Pill>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Muestra ilustrativa */}
          <section className="card card-quiet flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 flex-none text-bosque" />
              <div>
                <p className="text-[13.5px] font-semibold">Informe de muestra <span className="pill pill-sample ml-1">MUESTRA ILUSTRATIVA</span></p>
                <p className="mt-1 text-[12.5px] text-muted">Un análisis estático de ejemplo para explorar la estructura del informe sin conexión externa.</p>
              </div>
            </div>
            <LinkBtn href="/app/informe/PS-SAMPLE" variant="ghost" size="sm">Ver muestra</LinkBtn>
          </section>
        </>
      ) : (
        <EmptyState
          icon={<Radar className="h-6 w-6" />}
          title="Aún no hay análisis en este navegador"
          text="Analiza un sitio público para obtener tu primer informe con evidencia real, o explora el informe de muestra (ilustrativo, sin conexión)."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <LinkBtn href="/app/nuevo"><Radar className="h-4 w-4" />Analizar el primer sitio</LinkBtn>
              <LinkBtn href="/app/informe/PS-SAMPLE" variant="ghost">Ver informe ilustrativo</LinkBtn>
            </div>
          }
        />
      )}

      {lastLive ? (
        <p className="flex items-start gap-2 rounded-2xl border border-dashed border-line p-4 text-[12px] leading-5 text-muted">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
          El historial vive en el almacenamiento local de este navegador (sin cuentas ni base de datos en esta fase). Los resultados reflejan observaciones de la fecha de ejecución y no constituyen un dictamen legal.
        </p>
      ) : null}
    </div>
  );
}
