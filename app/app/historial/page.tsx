"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowRightLeft, FileText, PlayCircle, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import type { Analysis } from "@/lib/contracts";
import { clearHistory, deleteAnalysis, getHistory } from "@/lib/store";
import { formatDate, riesgoPillTone, scoreTone, severityLabels } from "@/lib/utils";
import { EmptyState, LinkBtn, Meter, Modal, Pill } from "@/components/ui";

export default function HistorialPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [list, setList] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<Analysis | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setList(getHistory());
    setReady(true);
  }, []);

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id]));

  const remove = (a: Analysis) => {
    setList(deleteAnalysis(a.id));
    setSelected((prev) => prev.filter((x) => x !== a.id));
    setToDelete(null);
  };

  const wipe = () => {
    clearHistory();
    setList([]);
    setSelected([]);
    setConfirmClear(false);
  };

  if (!ready) {
    return <div className="skeleton h-72" />;
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Historial</p>
          <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Análisis de este navegador</h1>
          <p className="mt-2 max-w-lg text-[13px] text-muted">
            Persistencia local (localStorage), sin cuentas ni base de datos en esta fase. Selecciona dos análisis para compararlos.
          </p>
        </div>
        {list.length > 0 ? (
          <button onClick={() => setConfirmClear(true)} className="btn btn-danger btn-sm">
            <Trash2 className="h-3.5 w-3.5" />Vaciar historial
          </button>
        ) : null}
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-6 w-6" />}
          title="Todavía no hay análisis guardados"
          text="Cada análisis completado queda disponible aquí, con su informe, evidencias y plan de acción."
          action={<LinkBtn href="/app/nuevo"><Radar2 />Analizar el primer sitio</LinkBtn>}
        />
      ) : (
        <div className="card divide-y divide-line-soft overflow-hidden p-0">
          {list.map((a) => {
            const checked = selected.includes(a.id);
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-4 p-4 md:p-5">
                <button
                  onClick={() => toggleSelect(a.id)}
                  aria-pressed={checked}
                  aria-label={`Seleccionar ${a.id} para comparar`}
                  className={`grid h-5 w-5 flex-none place-items-center rounded-md border transition-colors ${checked ? "border-[color:var(--c-bosque)] bg-[color:var(--c-bosque)] text-white dark:text-[#10231b]" : "border-line"}`}
                >
                  {checked ? "✓" : ""}
                </button>
                {a.dataMode === "live" ? (
                  <ShieldCheck className="h-4 w-4 flex-none text-menta" />
                ) : (
                  <PlayCircle className="h-4 w-4 flex-none text-muted" />
                )}
                <div className="min-w-0 flex-1">
                  {a.dataMode === "sample" ? <Pill tone="pill-sample" className="mb-1">MUESTRA ILUSTRATIVA</Pill> : null}
                  <Link href={`/app/informe/${a.id}`} className="flex items-center gap-2 font-disp text-[14.5px] font-semibold hover:text-bosque">
                    {a.input.host} <FileText className="h-3.5 w-3.5 text-muted" />
                  </Link>
                  <p className="text-[11.5px] text-muted">{formatDate(a.createdAt)} · {a.id} · {a.findings.length} hallazgos</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Pill tone={riesgoPillTone[a.riskLevel ?? "bajo"]}>{severityLabels[a.riskLevel ?? "bajo"]}</Pill>
                  <div className="w-24 hidden sm:block"><Meter value={a.score} sm /></div>
                  <Pill tone={scoreTone(a.score)}>{a.score}</Pill>
                </div>
                <button onClick={() => setToDelete(a)} className="btn btn-ghost btn-sm" aria-label={`Eliminar ${a.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {list.length >= 2 ? (
        <p className="text-[12px] text-muted">{selected.length === 2 ? "" : "Marca 2 análisis en las casillas para habilitar la comparación."}</p>
      ) : null}
      {selected.length === 2 ? (
        <div>
          <button onClick={() => router.push(`/app/comparar?ids=${selected[0]},${selected[1]}`)} className="btn btn-primary btn-sm">
            <ArrowRightLeft className="h-3.5 w-3.5" />Comparar {selected[0]} vs {selected[1]}
          </button>
        </div>
      ) : null}

      <p className="flex items-start gap-2 rounded-2xl border border-dashed border-line p-4 text-[12px] leading-5 text-muted">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
        Si vacías los datos del navegador, el historial se pierde de forma irreversible. Los informes pueden descargarse (.md/.json) desde cada informe.
      </p>

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Eliminar análisis">
        <p className="text-[13.5px] leading-6 text-muted">
          ¿Eliminar el análisis <span className="code">{toDelete?.id}</span> ({toDelete?.input.host}) de este navegador? Esta acción no puede deshacerse.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setToDelete(null)} className="btn btn-ghost btn-sm">Cancelar</button>
          <button onClick={() => toDelete && remove(toDelete)} className="btn btn-danger btn-sm">Eliminar</button>
        </div>
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Vaciar historial completo">
        <p className="text-[13.5px] leading-6 text-muted">
          Se eliminarán los {list.length} análisis guardados en este navegador. Exporta los informes importantes antes de continuar.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setConfirmClear(false)} className="btn btn-ghost btn-sm">Cancelar</button>
          <button onClick={wipe} className="btn btn-danger btn-sm">Vaciar definitivamente</button>
        </div>
      </Modal>
    </div>
  );
}

function Radar2() {
  return <span aria-hidden>📊</span>;
}
