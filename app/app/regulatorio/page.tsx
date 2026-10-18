import { Building2, ExternalLink, Landmark, Scale, ShieldCheck } from "lucide-react";
import { frameworkList } from "@/lib/frameworks";
import { Alert, Pill } from "@/components/ui";

export const metadata = {
  title: "Inteligencia regulatoria",
};

/* Inteligencia regulatoria: catálogo verificado de marcos + señales del motor.
   Page estática (server component): sin datos dinámicos ni hooks. */
export default function RegulatorioPage() {
  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Inteligencia regulatoria</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Marcos normativos y régimen temporal</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-muted">
          Catálogo de marcos utilizados por el motor, con referencias oficiales verificables. Las obligaciones legales
          corresponden a cada norma; las recomendaciones técnicas de PRIVACYOS se mantienen separadas de ellas.
        </p>
      </header>

      <div className="grid gap-5">
        {frameworkList.map((f) => (
          <section key={f.id} className="card p-6 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[color:var(--c-bosque-soft)] text-bosque">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-disp text-lg font-semibold">{f.nombre}</h2>
                  <p className="text-[12px] text-muted">{f.jurisdiccion}</p>
                </div>
              </div>
              <Pill tone={f.estado === "vigente" ? "pill-low" : "pill-med"}>{f.statusLabel}</Pill>
            </div>

            <p className="mt-5 text-[13.5px] leading-6">{f.summary}</p>
            <p className="mt-3 text-[13px] leading-6 text-muted">{f.statusDetail}</p>
            {f.temporalNote ? (
              <p className="mt-3 rounded-xl bg-[color:var(--c-risk-med-soft)] p-3.5 text-[12.5px] leading-5 text-[color:var(--c-risk-med)]">
                Régimen temporal: {f.temporalNote}
              </p>
            ) : null}

            <div className="mt-6">
              <p className="label">Requisitos relevantes para el tipo de análisis</p>
              <div className="grid gap-2.5">
                {f.requirements.map((r) => (
                  <div key={r.id} className="rounded-xl bg-[color:var(--c-marfil)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold">{r.title}</p>
                      <span className="pill pill-brand">{r.ref}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-dashed border-line p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold"><Building2 className="h-4 w-4 text-bosque" />Aplicabilidad</p>
                <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{f.applicability}</p>
              </div>
              <div className="rounded-xl border border-dashed border-line p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold"><ShieldCheck className="h-4 w-4 text-bosque" />Señales técnicas observadas</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {f.signals.map((s) => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
            </div>

            <a href={f.officialRef} target="_blank" rel="noreferrer noopener" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-bosque">
              {f.sourceLabel} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </section>
        ))}
      </div>

      <Alert kind="warning" title="Lo que la inteligencia regulatoria NO hace">
        <div className="flex gap-2.5">
          <Scale className="mt-0.5 h-4 w-4 flex-none text-[color:var(--c-risk-med)]" />
          <div>
            <p>
              PRIVACYOS no determina si una organización cumple una norma, no calcula sanciones y no emite dictámenes.
              Los vínculos entre evidencia técnica y normativas son indicativos y preparatorios; la interpretación
              de la aplicabilidad corresponde a asesoría jurídica.
            </p>
            <p className="mt-2">
              Marcos futuros (p. ej., LGPD de Brasil o leyes estatales de EE. UU.) figuran como «en preparación»: el
              motor solo evalúa las normativas del catálogo actual.
            </p>
          </div>
        </div>
      </Alert>
    </div>
  );
}
