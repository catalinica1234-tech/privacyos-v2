"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowRightLeft, FileText, PlayCircle, Radar, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import type { Analysis } from "@/lib/contracts";
import { eliminarRemoto, listarRemotos, summaryAAnalisis } from "@/lib/api-client";
import { formatDate, riesgoPillTone, scoreTone, severityLabels } from "@/lib/utils";
import { Alert, EmptyState, LinkBtn, Meter, Modal, Pill } from "@/components/ui";

function sortByDate(list: Analysis[]): Analysis[] {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function HistorialPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [list, setList] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<Analysis | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listarRemotos().then((rows) => {
      if (!active) return;
      setApiOk(rows !== null);
      setList(sortByDate((rows ?? []).map(summaryAAnalisis)));
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id]));

  const remove = async (a: Analysis) => {
    setBusy(true);
    setNotice(null);
    const ok = await eliminarRemoto(a.id);
    if (ok !== true) {
      setNotice("No se pudo confirmar el borrado. Recarga el historial para comprobar su estado.");
      setBusy(false);
      return;
    }
    setList((prev) => prev.filter((item) => item.id !== a.id));
    setSelected((prev) => prev.filter((x) => x !== a.id));
    setToDelete(null);
    setBusy(false);
  };

  const wipe = async () => {
    setBusy(true);
    setNotice(null);
    const ids = list.map((a) => a.id);
    const results = await Promise.all(ids.map((id) => eliminarRemoto(id)));
    const deleted = new Set(ids.filter((_, i) => results[i] === true));
    setList((prev) => prev.filter((a) => !deleted.has(a.id)));
    setSelected((prev) => prev.filter((id) => !deleted.has(id)));
    setConfirmClear(false);
    setBusy(false);
    if (deleted.size !== ids.length) {
      setNotice("Algunos borrados no se pudieron confirmar. Recarga el historial para comprobar su estado.");
    }
  };

  if (!ready) {
    return <div className="skeleton h-72" />;
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Historial</p>
          <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Tu historial de análisis</h1>
          <p className="mt-2 max-w-lg text-[13px] text-muted">
            Análisis guardados en tu espacio de trabajo. Selecciona dos para compararlos.
          </p>
        </div>
        {list.length > 0 ? (
          <button onClick={() => setConfirmClear(true)} className="btn btn-danger btn-sm" disabled={busy}>
            <Trash2 className="h-3.5 w-3.5" />Vaciar historial
          </button>
        ) : null}
      </header>

      {apiOk === false ? (
        <Alert kind="warning" title="Base de datos no disponible">
          No se pudo consultar el historial. Recarga la página para volver a intentarlo.
        </Alert>
      ) : null}

      <div role="status" aria-live="polite" className="min-h-0">
        {notice ? <Alert kind="warning" title="Aviso">{notice}</Alert> : null}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-6 w-6" />}
          title="Todavía no hay análisis guardados"
          text="Cada análisis completado queda disponible aquí, con su informe, evidencias y plan de acción."
          action={<LinkBtn href="/app/nuevo"><Radar className="h-3.5 w-3.5" />Analizar el primer sitio</LinkBtn>}
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
                  <ShieldCheck className="h-4 w-4 flex-none text-menta" aria-hidden="true" />
                ) : (
                  <PlayCircle className="h-4 w-4 flex-none text-muted" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/app/informe/${a.id}`} className="flex items-center gap-2 font-disp text-[14.5px] font-semibold hover:text-bosque">
                    {a.input.host} <FileText className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  </Link>
                  <p className="text-[11.5px] text-muted">
                    {formatDate(a.createdAt)} · {a.id}
                    {a.findings.length > 0 ? ` · ${a.findings.length} hallazgos` : ""}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Pill tone={riesgoPillTone[a.riskLevel ?? "bajo"]}>{severityLabels[a.riskLevel ?? "bajo"]}</Pill>
                  <div className="hidden w-24 sm:block"><Meter value={a.score} sm label={`${a.input.host}: ${a.score} de 100`} /></div>
                  <Pill tone={scoreTone(a.score)}>{a.score}</Pill>
                </div>
                <button onClick={() => setToDelete(a)} className="btn btn-ghost btn-sm" aria-label={`Eliminar ${a.id}`} disabled={busy}>
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
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
        El acceso al espacio de trabajo depende de la cookie privada de este navegador. Si borras los datos del
        navegador, perderás el acceso a los análisis del servidor (aún no hay cuentas de recuperación). Descarga los
        informes importantes en .md o .json.
      </p>

      <Modal open={toDelete !== null} onClose={() => !busy && setToDelete(null)} title="Eliminar análisis">
        <p className="text-[13.5px] leading-6 text-muted">
          ¿Eliminar el análisis <span className="code">{toDelete?.id}</span> ({toDelete?.input.host}) de tu espacio de
          trabajo? Esta acción no puede deshacerse.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setToDelete(null)} className="btn btn-ghost btn-sm" disabled={busy}>Cancelar</button>
          <button onClick={() => toDelete && remove(toDelete)} className="btn btn-danger btn-sm" disabled={busy}>
            {busy ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </Modal>

      <Modal open={confirmClear} onClose={() => !busy && setConfirmClear(false)} title="Vaciar historial completo">
        <p className="text-[13.5px] leading-6 text-muted">
          Se eliminarán los {list.length} análisis de tu espacio de trabajo mostrados en el historial. Exporta
          los informes importantes antes de continuar.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setConfirmClear(false)} className="btn btn-ghost btn-sm" disabled={busy}>Cancelar</button>
          <button onClick={wipe} className="btn btn-danger btn-sm" disabled={busy}>
            {busy ? "Vaciando…" : "Vaciar definitivamente"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
