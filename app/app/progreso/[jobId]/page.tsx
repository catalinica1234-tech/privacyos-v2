"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, LoaderCircle, Radar, Save } from "lucide-react";
import { getPendingAnalysis } from "@/lib/store";
import { crearAnalisisServidor } from "@/lib/api-client";
import { Alert, LinkBtn, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   Seguimiento de un análisis REAL (/app/progreso/[jobId]).
   El motor ejecuta todas las etapas en el servidor con una única
   solicitud; esta línea de tiempo las representa a medida que la
   respuesta llega. No se simulan datos: solo se marca el avance.
   El contexto del análisis (URL y marcos) permanece en localStorage
   hasta que la corrida termina, de modo que «Reintentar» no vuelve a
   pedir los datos ni ejecuta un análisis distinto.
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
  const requestRef = useRef<{ jobId: string; result: ReturnType<typeof crearAnalisisServidor> } | null>(null);

  useEffect(() => {
    const pending = getPendingAnalysis();
    // Solo se reutiliza el contexto si corresponde a ESTE identificador:
    // abrir una URL antigua de progreso no debe analizar otro sitio.
    const contexto = pending && pending.id === jobId ? pending : null;
    if (contexto) setTarget(contexto.url);

    if (!contexto?.url) {
      setError({
        message: "No encontramos los datos de este análisis en el navegador.",
        hint: "Puede que hayas abierto esta página en otro equipo o borrado los datos del sitio. Inicia un análisis nuevo.",
      });
      return;
    }

    let cancelado = false;
    const ticker = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 700);
    const detener = () => {
      cancelado = true;
      window.clearInterval(ticker);
    };
    const fallar = (message: string, hint: string) => {
      if (cancelado) return;
      detener();
      setError({ message, hint });
    };

    (async () => {
      try {
        const cuerpo = {
          id: /^PS-[A-Z0-9]{6}$/.test(jobId) ? jobId : undefined,
          url: contexto.url,
          frameworkIds: contexto.frameworkIds.length > 0 ? contexto.frameworkIds : (["CL-1928", "CL-21719", "GDPR"] as const),
        };

        if (requestRef.current?.jobId !== jobId) {
          requestRef.current = {
            jobId,
            result: crearAnalisisServidor({ ...cuerpo, frameworkIds: [...cuerpo.frameworkIds] }),
          };
        }
        const viaApi = await requestRef.current.result;
        if (cancelado) return;
        if ("error" in viaApi) {
          fallar(
            viaApi.error.message ?? "No se pudo guardar el análisis.",
            viaApi.error.hint ?? "Comprueba el servicio y vuelve a intentarlo.",
          );
          return;
        }

        window.clearInterval(ticker);
        setStage(STAGES.length);
        router.replace(`/app/informe/${viaApi.analysis.id}`);
      } catch {
        fallar(
          "No se pudo contactar al motor de análisis.",
          "Comprueba tu conexión o que el servidor esté en ejecución, y vuelve a intentarlo.",
        );
      }
    })();

    return detener;
  }, [jobId, router]);

  const etapaActual = Math.min(stage, STAGES.length - 1);
  const enCurso = !error && stage < STAGES.length;

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Análisis en curso</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Ejecutando el motor de observación</h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-muted">
          {target
            ? `Destino: ${target} · el identificador de esta corrida es ${jobId}.`
            : `El identificador de esta corrida es ${jobId}.`}
        </p>
      </header>

      <section className="card p-6 md:p-7">
        <p className="sr-only" role="status" aria-live="polite">
          {error
            ? "El análisis se detuvo por un error."
            : enCurso
              ? `Etapa ${etapaActual + 1} de ${STAGES.length}: ${STAGES[etapaActual]}.`
              : "Análisis completado. Abriendo el informe."}
        </p>

        <ol className="grid gap-1" aria-label="Etapas del análisis">
          {STAGES.map((label, i) => {
            const done = i < stage;
            const active = i === stage && !error;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", active && "bg-[color:var(--c-bosque-soft)]")}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 flex-none text-menta" aria-hidden="true" />
                ) : active ? (
                  <LoaderCircle className="h-4 w-4 flex-none spin text-bosque" aria-hidden="true" />
                ) : (
                  <CircleDashed className="h-4 w-4 flex-none text-muted opacity-50" aria-hidden="true" />
                )}
                <p className={cn("text-[13.5px]", !done && active ? "font-medium text-ink" : "text-muted")}>
                  {label}
                  {done ? <span className="sr-only"> (completada)</span> : null}
                  {active ? <span className="sr-only"> (en curso)</span> : null}
                </p>
              </li>
            );
          })}
        </ol>

        {error ? (
          <div className="mt-6 grid gap-4">
            <Alert kind="danger" title="El análisis no pudo completarse">
              <p>{error.message}</p>
              {error.hint ? <p className="mt-1.5">{error.hint}</p> : null}
            </Alert>
            <div className="flex flex-wrap gap-3">
              {target ? (
                <button onClick={() => window.location.reload()} className="btn btn-primary btn-sm">Reintentar</button>
              ) : null}
              <LinkBtn href="/app/nuevo" size="sm"><Radar className="h-3.5 w-3.5" />Iniciar un análisis</LinkBtn>
              <LinkBtn href="/app/dashboard" variant="subtle" size="sm">Volver al panel</LinkBtn>
            </div>
          </div>
        ) : (
          <p className="mt-6 flex items-center gap-2 text-[12px] text-muted">
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            El resultado se guarda en PostgreSQL antes de abrir el informe.
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
