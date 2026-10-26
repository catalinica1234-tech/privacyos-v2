"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, LoaderCircle, Radar, Save } from "lucide-react";
import { analyzeResponse } from "@/lib/contracts";
import { clearPendingAnalysis, getPendingAnalysis, saveAnalysis } from "@/lib/store";
import { crearAnalisisServidor } from "@/lib/api-client";
import { Alert, LinkBtn, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   Seguimiento de un análisis REAL (/app/progreso/[jobId]).
   El motor ejecuta todas las etapas en el servidor con una única
   solicitud; esta línea de tiempo las representa a medida que la
   respuesta llega. No se simulan datos: solo se marca el avance.
   ═════════════════════════════════════════════════════════════════ */

const STAGES = [
  "Validación de URL y protocolo",
  "Comprobaciones de seguridad (anti-SSRF)",
  "Resolución DNS del dominio",
  "Solicitud HTTP con redirecciones validadas",
  "Cabeceras de seguridad y cookies",
  "HTML inicial y robots.txt",
  "Evaluación de hallazgos y puntaje",
] as const;

export default function ProgresoPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId ?? "";

  const [stage, setStage] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; hint: string } | null>(null);
  const [persistido, setPersistido] = useState<boolean | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const pending = getPendingAnalysis();
    if (pending) setTarget(pending.url);
    clearPendingAnalysis();

    const ticker = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 700);

    (async () => {
      try {
        const cuerpo = {
          id: jobId && /^PS-[A-Z0-9]{6}$/.test(jobId) ? jobId : undefined,
          url: pending?.url ?? "",
          frameworkIds: pending?.frameworkIds ?? ["CL-1928", "CL-21719", "GDPR"],
        };

        // Hito 2: la ruta real corre el motor Y persiste en la base de datos.
        // Si la API no está disponible (p. ej. base caída), degrada a la
        // ruta del Hito 1 (/api/analyze, sin persistencia) para que la
        // herramienta no se bloquee; el usuario lo ve aclarado en pantalla.
        const viaApi = await crearAnalisisServidor({ url: cuerpo.url, frameworkIds: cuerpo.frameworkIds, id: cuerpo.id });
        if ("analysis" in viaApi) {
          window.clearInterval(ticker);
          setStage(STAGES.length);
          saveAnalysis(viaApi.analysis);
          setPersistido(true);
          await new Promise((r) => setTimeout(r, 500));
          router.replace(`/app/informe/${viaApi.analysis.id}`);
          return;
        }
        if (viaApi.status !== 0 && viaApi.error.code !== "RED" && viaApi.error.code !== "ERROR_INTERNO") {
          // Errores con significado de dominio (URL inválida, protocolo, 403…): mostrarlos tal cual.
          setError({ message: viaApi.error.message ?? "El análisis no pudo ejecutarse.", hint: viaApi.error.hint ?? "" });
          return;
        }
        setPersistido(false);

        // Degradación: motor sin persistencia (Hito 1).
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(cuerpo),
        });
        const json: unknown = await res.json();
        const parsed = analyzeResponse.safeParse(json);
        if (!parsed.success) {
          setError({
            message: "La respuesta del motor no pudo validarse.",
            hint: "Vuelve a intentarlo; si persiste, revisa la conexión del servidor.",
          });
          return;
        }
        if (!parsed.data.ok) {
          setError({ message: parsed.data.message, hint: parsed.data.hint });
          return;
        }
        window.clearInterval(ticker);
        setStage(STAGES.length);
        saveAnalysis(parsed.data.analysis);
        await new Promise((r) => setTimeout(r, 500));
        router.replace(`/app/informe/${parsed.data.analysis.id}`);
      } catch {
        setError({
          message: "No se pudo contactar al motor de análisis.",
          hint: "Comprueba tu conexión o que el servidor esté en ejecución, y vuelve a intentarlo.",
        });
      }
    })();

    return () => window.clearInterval(ticker);
  }, [jobId, router]);

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Análisis en curso</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Ejecutando el motor de observación</h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-muted">
          {target
            ? `Destino: ${target} · el identificador de esta corrida es ${jobId}.`
            : "Se ejecutará con el destino configurado en «Nuevo análisis» (identificador " + jobId + ")."}
        </p>
      </header>

      <section className="card p-6 md:p-7">
        <div className="grid gap-1">
          {STAGES.map((label, i) => {
            const done = i < stage;
            const active = i === stage && !error;
            return (
              <div key={label} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", active && "bg-[color:var(--c-bosque-soft)]")}>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 flex-none text-menta" />
                ) : active ? (
                  <LoaderCircle className="h-4 w-4 flex-none spin text-bosque" />
                ) : (
                  <CircleDashed className="h-4 w-4 flex-none text-muted opacity-50" />
                )}
                <p className={cn("text-[13.5px]", !done && active ? "font-medium text-ink" : "text-muted")}>{label}</p>
              </div>
            );
          })}
        </div>

        {error ? (
          <div className="mt-6 grid gap-4">
            <Alert kind="danger" title="El análisis no pudo completarse">
              <p>{error.message}</p>
              <p className="mt-1.5">{error.hint}</p>
            </Alert>
            <div className="flex flex-wrap gap-3">
              <LinkBtn href="/app/nuevo" size="sm"><Radar className="h-3.5 w-3.5" />Corregir la URL</LinkBtn>
              <button onClick={() => window.location.reload()} className="btn btn-ghost btn-sm">Reintentar</button>
              <LinkBtn href="/app/dashboard" variant="subtle" size="sm">Volver al panel</LinkBtn>
            </div>
          </div>
        ) : (
          <p className="mt-6 flex items-center gap-2 text-[12px] text-muted">
            <Save className="h-3.5 w-3.5" />
            {persistido === false
              ? "La base de datos no responde: el resultado se guardará solo en este navegador (sin servidor)."
              : "El resultado se guardará en la base de datos del servidor y en este navegador."}
          </p>
        )}
      </section>

      <div className="no-print">
        <Pill tone="pill-neutral">
          El motor ejecuta las etapas anteriores en una única solicitud; la línea de tiempo se ilumina conforme llega la respuesta y es una representación, no una medición por etapa.
        </Pill>
      </div>
    </div>
  );
}
