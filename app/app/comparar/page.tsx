"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, FileText, PlayCircle, ShieldCheck } from "lucide-react";
import type { Analysis } from "@/lib/contracts";
import { analisisRemoto } from "@/lib/api-client";
import { formatDate, riesgoPillTone, scoreTone, severityLabels } from "@/lib/utils";
import { EmptyState, LinkBtn, Meter, Pill } from "@/components/ui";

export default function CompararPage() {
  return (
    <Suspense fallback={<div className="skeleton h-72" />}>
      <CompararInner />
    </Suspense>
  );
}

function CompararInner() {
  const params = useSearchParams();
  const idsKey = params.get("ids") ?? "";
  const ids = useMemo(() => idsKey.split(",").filter(Boolean), [idsKey]);
  const [result, setResult] = useState<{ key: string; reports: (Analysis | null)[] }>();

  useEffect(() => {
    if (ids.length !== 2 || ids[0] === ids[1]) return;
    let active = true;
    Promise.all(ids.map((id) => analisisRemoto(id)))
      .then((reports) => { if (active) setResult({ key: idsKey, reports }); });
    return () => { active = false; };
  }, [ids, idsKey]);

  const validSelection = ids.length === 2 && ids[0] !== ids[1];
  if (validSelection && result?.key !== idsKey) {
    return <div className="skeleton h-72" role="status" aria-label="Cargando los análisis seleccionados" />;
  }

  const [a, b] = validSelection ? result?.reports ?? [] : [];
  if (!a || !b) {
    return (
      <EmptyState
        icon={<ArrowRightLeft className="h-6 w-6" />}
        title="Comparación no disponible"
        text="Se requieren dos análisis guardados y comparables. Marca dos fila(s) del historial para compararlas."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <LinkBtn href="/app/historial" variant="ghost" size="sm">Ir al historial</LinkBtn>
            <LinkBtn href="/app/nuevo" size="sm">Nuevo análisis</LinkBtn>
          </div>
        }
      />
    );
  }

  const [older, newer] = [a, b].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Comparación</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Evolución entre dos análisis</h1>
        <p className="mt-2 max-w-xl text-[13.5px] text-muted">
          Compara dimensiones y hallazgos entre corridas. Útil tras aplicar el plan de acción para verificar el efecto.
        </p>
      </header>

      {/* Cabecera comparativa */}
      <section className="grid gap-4 md:grid-cols-2">
        {[a, b].map((x, i) => (
          <div key={x.id} className={i === 0 ? "card p-5" : "card p-5"}>
            <div className="flex items-center gap-2">
              {x.dataMode === "live"
                ? <ShieldCheck className="h-4 w-4 text-menta" />
                : <PlayCircle className="h-4 w-4 text-muted" />}
              <Pill tone={scoreTone(x.score)}>{x.score}/100</Pill>
              <Pill tone={riesgoPillTone[x.riskLevel ?? "bajo"]}>{severityLabels[x.riskLevel ?? "bajo"]}</Pill>
            </div>
            <Link href={`/app/informe/${x.id}`} className="mt-3 inline-flex items-center gap-2 font-disp text-lg font-semibold hover:text-bosque">
              {x.input.host} <FileText className="h-4 w-4 text-muted" />
            </Link>
            <p className="text-[12px] text-muted">{formatDate(x.createdAt)} · {x.id}</p>
            <p className="mt-3 text-[12.5px] text-muted">{x.findings.length} hallazgos · {x.evidence.length} evidencias</p>
          </div>
        ))}
      </section>

      {/* Dimensiones */}
      <section className="card p-6">
        <p className="eyebrow">Dimensiones</p>
        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted">
              <th className="pb-2 font-medium">Dimensión</th>
              <th className="pb-2 font-medium">{formatDate(a.createdAt).split("·")[0]} ({a.id})</th>
              <th className="pb-2 font-medium">{formatDate(b.createdAt).split("·")[0]} ({b.id})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {a.dimensions.map((d) => {
              const other = b.dimensions.find((y) => y.id === d.id);
              const delta = other && d.evaluated && other.evaluated ? other.value - d.value : null;
              return (
                <tr key={d.id}>
                  <td className="py-2.5 pr-3">{d.label}{!d.evaluated || !other?.evaluated ? <span className="text-muted"> · n/e</span> : null}</td>
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><Meter value={d.value} sm /><span className="tnum text-[12px]">{d.evaluated ? d.value : "—"}</span></div></td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Meter value={other?.value ?? 0} sm />
                      <span className="tnum text-[12px]">{other?.evaluated ? other.value : "—"}</span>
                      {delta !== null && delta !== 0 ? (
                        <span className={`tnum text-[11px] font-semibold ${delta > 0 ? "text-[color:var(--c-bosque)]" : "text-[color:var(--c-risk-crit)]"}`}>
                          {delta > 0 ? "+" : ""}{delta}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Severidades */}
      <section className="card p-6">
        <p className="eyebrow">Hallazgos por severidad</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["critico", "alto", "medio", "bajo"] as const).map((s) => {
            const ca = a.findings.filter((f) => f.severity === s && !f.title.startsWith("Observación positiva")).length;
            const cb = b.findings.filter((f) => f.severity === s && !f.title.startsWith("Observación positiva")).length;
            return (
              <div key={s} className="rounded-2xl bg-[color:var(--c-marfil)] p-4 text-center">
                <Pill tone={riesgoPillTone[s]}>{severityLabels[s]}</Pill>
                <p className="mt-2.5 font-disp text-xl font-semibold tnum">{ca} → {cb}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Diferencia de hallazgos */}
      <section className="grid gap-3">
        <p className="eyebrow">Novedades del análisis más reciente ({newer.id})</p>
        {newer.findings
          .filter((f) => !older.findings.some((g) => g.title === f.title))
          .map((f) => (
            <div key={f.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="code">{f.id}</span>
                <Pill tone={riesgoPillTone[f.severity]}>{severityLabels[f.severity]}</Pill>
                {f.title.startsWith("Observación positiva") ? <Pill tone="pill-brand">Positiva</Pill> : null}
              </div>
              <p className="mt-2 font-disp text-[14px] font-semibold">{f.title}</p>
            </div>
          ))}
        {newer.findings.filter((f) => !older.findings.some((g) => g.title === f.title)).length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-[12.5px] text-muted">
            Sin hallazgos nuevos respecto al análisis anterior (los títulos idénticos se consideran continuados).
          </p>
        ) : null}
      </section>
    </div>
  );
}
