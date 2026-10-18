"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Globe2, Radar, ShieldCheck } from "lucide-react";
import type { FrameworkId } from "@/lib/contracts";
import { frameworkList } from "@/lib/frameworks";
import { setPendingAnalysis } from "@/lib/store";
import { shortId } from "@/lib/utils";
import { Alert, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

function validateUrlClient(raw: string): string | null {
  if (!raw.trim()) return "Ingresa la URL del sitio a analizar.";
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "Formato inválido. Ejemplo: https://empresa.cl";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "Solo se permiten direcciones HTTP o HTTPS.";
  if (url.username || url.password) return "La URL no puede incluir credenciales embebidas.";
  if (url.port && url.port !== "80" && url.port !== "443") return "Solo se aceptan los puertos estándar 80 y 443.";
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return "El dominio no parece público y válido.";
  return null;
}

function NuevoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FrameworkId[]>(["CL-1928", "CL-21719"]);

  useEffect(() => {
    const prefill = params.get("url");
    if (prefill) setUrl(prefill);
  }, [params]);

  const toggle = (id: FrameworkId) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const explanation = useMemo(() => (url ? validateUrlClient(url) : null), [url]);

  const submit = () => {
    const id = shortId();
    const vErr = validateUrlClient(url);
    if (vErr) {
      setError(vErr);
      return;
    }
    if (selected.length === 0) {
      setError("Selecciona al menos un marco normativo para el análisis.");
      return;
    }
    setError(null);
    setPendingAnalysis({ id, url: url.trim(), frameworkIds: selected });
    router.push(`/app/progreso/${id}`);
  };

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Nuevo análisis</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Analizar un sitio web</h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-muted">
          Ingresa la URL pública y elige los marcos normativos. El motor observará la página inicial con límites de
          tiempo y de bytes, y generará hallazgos únicamente a partir de evidencia real.
        </p>
      </header>

      <section className="card p-6 md:p-7">
        <label htmlFor="url" className="label">URL del sitio a analizar</label>
        <input
          id="url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://empresa.cl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={cn("input", explanation ? "input-error" : "")}
        />
        {explanation ? (
          <p className="mt-2 text-[12.5px] font-medium text-[color:var(--c-risk-crit)]">{explanation}</p>
        ) : url ? (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[color:var(--c-bosque)]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Formato válido · protocolo correcto
          </p>
        ) : (
          <p className="hint">Solo HTTP/HTTPS públicos, sin credenciales y en puertos estándar (80/443).</p>
        )}

        <div className="mt-8">
          <p className="label">Marcos normativos del análisis</p>
          <div className="grid gap-3 md:grid-cols-3">
            {frameworkList.map((f) => {
              const checked = selected.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  aria-pressed={checked}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    checked
                      ? "border-[color:var(--c-bosque)] bg-[color:var(--c-bosque-soft)]"
                      : "border-line bg-[color:var(--c-card)] hover:border-[color:var(--c-muted)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Globe2 className={cn("h-4 w-4", checked ? "text-bosque" : "text-muted")} />
                    {checked ? <CheckCircle2 className="h-4 w-4 text-bosque" /> : <Pill tone="pill-neutral">{checked}</Pill>}
                  </div>
                  <p className="mt-3 font-disp text-[14.5px] font-semibold leading-snug">{f.nombre}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{f.jurisdiccion}</p>
                  <Pill tone={f.estado === "vigente" ? "pill-low" : "pill-med"} className="mt-3">{f.statusLabel}</Pill>
                </button>
              );
            })}
          </div>
          <p className="hint mt-3">
            Los hallazgos se vinculan a los marcos elegidos con referencias indicativas. La aplicabilidad real de cada
            norma depende de la jurisdicción y actividades de la organización.
          </p>
        </div>

        {error ? <div className="mt-5"><Alert kind="danger" title="No se puede iniciar">{error}</Alert></div> : null}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button onClick={submit} className="btn btn-primary" disabled={Boolean(explanation)}>
            <Radar className="h-4 w-4" /> Iniciar análisis
          </button>
          <span className="text-[12px] text-muted">Suele tardar entre 2 y 8 segundos según el destino.</span>
        </div>
      </section>

      <Alert kind="info" title="Comprobaciones de seguridad del motor">
        <p className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-bosque" />
          Antes de consultar el destino, el servidor valida protocolo y puertos, resuelve DNS y bloquea redes privadas,
          servicios internos y metadatos de nube (protección SSRF). Cada redirección se revalida antes de seguirla.
        </p>
      </Alert>
    </div>
  );
}

export default function NuevoPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <NuevoForm />
    </Suspense>
  );
}
