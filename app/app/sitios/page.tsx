"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, EmptyState, LinkBtn, Modal } from "@/components/ui";
import { Globe2, Radar } from "lucide-react";

type Site = { id: string; url: string; nombre: string | null; notas: string | null };

export default function SitiosPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<Site | "new" | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/sites", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]) })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || data.ok !== true || !Array.isArray(data.sites)) throw new Error("sites");
        if (!controller.signal.aborted) setSites(data.sites);
      })
      .catch(() => { if (!controller.signal.aborted) setUnavailable(true); })
      .finally(() => { if (!controller.signal.aborted) setLoaded(true); });
    return () => controller.abort();
  }, [reload]);

  async function mutate(site: Site | "new", method: "POST" | "PATCH" | "DELETE", body?: object) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(site === "new" ? "/api/sites" : "/api/sites/" + encodeURIComponent(site.id), {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(12_000),
      });
      if (method === "DELETE" && response.status === 204 && site !== "new") {
        setSites(previous => previous.filter(row => row.id !== site.id));
        setDeleting(null);
        return;
      }
      const result = await response.json();
      if (!response.ok || result.ok !== true || !result.site) {
        setError(result.message ?? "No se pudo confirmar el cambio. Vuelve a intentarlo.");
        return;
      }
      setSites(previous => site === "new" ? [result.site, ...previous] : previous.map(row => row.id === site.id ? result.site : row));
      setEditor(null);
    } catch {
      setError("No se pudo contactar al servidor. Verifica el estado antes de volver a intentar.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const data = new FormData(event.currentTarget);
    const url = String(data.get("url") ?? "").trim();
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("url");
    } catch {
      setError("Ingresa una URL HTTP o HTTPS sin credenciales.");
      return;
    }
    const nombre = String(data.get("nombre") ?? "").trim();
    const notas = String(data.get("notas") ?? "").trim();
    void mutate(editor, editor === "new" ? "POST" : "PATCH", { url, nombre: nombre || null, notas: notas || null });
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="eyebrow">Espacio de trabajo</p><h1 className="mt-1 font-disp text-2xl font-semibold">Sitios registrados</h1></div>
        <button className="btn btn-primary btn-sm" disabled={!loaded || unavailable}
          onClick={() => { setEditor("new"); setError(""); }}>Registrar sitio</button>
      </header>
      {!loaded ? <div className="skeleton h-32" role="status" aria-label="Cargando sitios" /> : null}
      {unavailable ? <Alert kind="warning" title="No se pudieron cargar los sitios">
        <button className="btn btn-ghost btn-sm" onClick={() => { setUnavailable(false); setLoaded(false); setReload(n => n + 1); }}>Reintentar</button>
      </Alert> : null}
      {loaded && !unavailable && !sites.length ? <EmptyState icon={<Globe2 className="h-6 w-6" />}
        title="Todavía no hay sitios registrados" text="Registra un sitio para asociar sus próximos análisis." /> : null}
      {sites.map(site => (
        <article className="card p-5" key={site.id}>
          <h2 className="font-disp text-lg font-semibold">{site.nombre || site.url}</h2>
          <p className="break-all text-[13px] text-muted">{site.url}</p>
          {site.notas ? <p className="mt-2 text-[13px]">{site.notas}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkBtn href={"/app/nuevo?" + new URLSearchParams({ url: site.url, siteId: site.id })} size="sm">
              <Radar className="h-4 w-4" />Analizar
            </LinkBtn>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditor(site); setError(""); }}>Editar</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setDeleting(site); setError(""); }}>Eliminar</button>
          </div>
        </article>
      ))}
      <Modal open={Boolean(editor)} onClose={() => { if (!busy) setEditor(null); }} title={editor === "new" ? "Registrar sitio" : "Editar sitio"}>
        <form onSubmit={save} key={editor === "new" ? "new" : editor?.id} className="grid gap-3">
          <label className="label">URL<input type="url" name="url" className="input" required maxLength={2048} defaultValue={editor && editor !== "new" ? editor.url : ""} /></label>
          <label className="label">Nombre<input name="nombre" className="input" maxLength={120} defaultValue={editor && editor !== "new" ? editor.nombre ?? "" : ""} /></label>
          <label className="label">Notas<textarea name="notas" className="input" maxLength={2000} defaultValue={editor && editor !== "new" ? editor.notas ?? "" : ""} /></label>
          {error ? <p role="alert" className="text-[13px] text-muted">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Guardando…" : "Guardar sitio"}</button>
        </form>
      </Modal>
      <Modal open={Boolean(deleting)} onClose={() => { if (!busy) setDeleting(null); }} title="Eliminar sitio">
        <p className="text-[13px] text-muted">¿Quieres eliminar {deleting?.nombre || deleting?.url}? Los sitios con análisis asociados se conservan.</p>
        {error ? <p role="alert" className="mt-2 text-[13px] text-muted">{error}</p> : null}
        <button className="btn btn-danger btn-sm mt-4" disabled={busy}
          onClick={() => { if (deleting) void mutate(deleting, "DELETE"); }}>{busy ? "Eliminando…" : "Confirmar eliminación"}</button>
      </Modal>
    </div>
  );
}
