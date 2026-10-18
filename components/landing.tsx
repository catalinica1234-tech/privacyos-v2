"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  Cookie,
  FileSearch,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Lock,
  Menu,
  Radar,
  ScrollText,
  Search,
  Scale,
  ShieldCheck,
  SunMoon,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme";
import { Alert, LinkBtn, Meter, Pill, SectionHead } from "@/components/ui";
import { sampleAnalysis } from "@/lib/sample";
import { FRAMEWORKS, frameworkList } from "@/lib/frameworks";
import { severityLabels } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   LANDING COMERCIAL — Serenidad.
   Todo dato visible proviene del dataset marcado como MUESTRA
   ILUSTRATIVA o de hechos verificables (fechas oficiales leychile).
   Sin clientes, métricas ni testimonios inventados.
   ═════════════════════════════════════════════════════════════════ */

function daysUntilVigencia(): number {
  const target = new Date("2026-12-01T00:00:00");
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="PRIVACYOS · inicio">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-bosque font-disp text-[13px] font-bold text-white dark:text-[#10231b]">P</span>
      <span className={`font-disp text-lg font-semibold tracking-tight ${light ? "text-white" : ""}`}>PRIVACYOS</span>
    </Link>
  );
}

function ThemeBtn() {
  const { resolvedDark, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedDark ? "light" : "dark")}
      className="btn btn-ghost btn-sm"
      aria-label="Cambiar tema"
    >
      <SunMoon className="h-4 w-4" />
      <span className="hidden sm:inline">{resolvedDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    ["#riesgos", "Riesgos"],
    ["#como-funciona", "Cómo funciona"],
    ["#marcos", "Normativas"],
    ["#informe", "Informe"],
    ["#faq", "FAQ"],
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-[color:var(--c-canvas)]/90 backdrop-blur">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeBtn />
          <LinkBtn href="/app/dashboard" size="sm" className="hidden sm:inline-flex">
            Abrir la aplicación
          </LinkBtn>
          <button className="btn btn-ghost btn-sm md:hidden" onClick={() => setOpen(!open)} aria-label="Menú">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-line-soft px-5 py-3 md:hidden" aria-label="Menú móvil">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-[color:var(--c-marfil)]">
              {label}
            </a>
          ))}
          <Link href="/app/dashboard" className="btn btn-primary mt-2 w-full">Abrir la aplicación</Link>
        </nav>
      ) : null}
    </header>
  );
}

function HeroVisualMock() {
  const a = sampleAnalysis;
  return (
    <div className="relative">
      <Pill tone="pill-sample" className="absolute -top-3 left-4 z-10">MUESTRA ILUSTRATIVA</Pill>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Informe de ejemplo</p>
            <p className="font-disp text-lg font-semibold">{a.input.host}</p>
          </div>
          <Pill tone="pill-med">{severityLabels[a.riskLevel ?? "medio"]}</Pill>
        </div>
        <div className="mt-5 flex items-end gap-4">
          <p className="font-disp text-5xl font-semibold tracking-tight tnum">{a.score}</p>
          <div className="pb-1.5">
            <p className="text-[12px] font-medium text-[color:var(--c-bosque)]">Privacy Score</p>
            <p className="text-[11px] text-muted">Sobre 100 · fórmula documentada</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {a.dimensions.filter((d) => d.evaluated).map((d) => (
            <div key={d.id} className="grid grid-cols-[150px_1fr_34px] items-center gap-3">
              <span className="text-[12.5px] text-muted">{d.label}</span>
              <Meter value={d.value} sm />
              <span className="tnum text-right text-[12px] font-medium">{d.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-[color:var(--c-risk-med-soft)] p-4">
          <p className="text-[12.5px] font-medium text-[color:var(--c-risk-med)]">
            {a.findings.length} hallazgos · prioridades P2–P4 · cada uno con evidencia y limitación declarada
          </p>
        </div>
        <Link href="/app/informe/PS-SAMPLE" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-bosque">
          Ver informe de ejemplo completo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="card card-quiet absolute -bottom-6 -left-4 hidden items-center gap-2.5 p-3.5 sm:flex">
        <ShieldCheck className="h-4 w-4 text-menta" />
        <p className="text-[12px]"><span className="font-semibold">Sin crawlers ni recolección agresiva</span> · solo la página inicial</p>
      </div>
    </div>
  );
}

function Hero() {
  const dias = useMemo(daysUntilVigencia, []);
  return (
    <section className="border-b border-line-soft">
      <div className="container mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20">
        <div className="animate-in">
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone="pill-brand">
              <Scale className="h-3.5 w-3.5" />
              Ley 21.719 · entra en vigor el 01-DIC-2026
            </Pill>
            <span className="text-[12px] font-medium text-muted">faltan {dias} días · texto oficial en LeyChile</span>
          </div>
          <h1 className="mt-6 font-disp text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[54px] lg:leading-[1.05]">
            Entiende la privacidad de tu sitio web <span className="text-bosque">antes de que la ley lo exija.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            PRIVACYOS inspecciona la página inicial de tu sitio web, observa evidencia técnica real — cabeceras de seguridad,
            cookies y tecnologías de terceros — y la traduce en un informe claro con score explicable, hallazgos clasificados y
            un plan de acción priorizado frente a la Ley 19.628, la próxima Ley 21.719 y el RGPD.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkBtn href="/app/nuevo" size="lg">
              <Search className="h-4 w-4" />
              Analizar un sitio
            </LinkBtn>
            <LinkBtn href="/app/dashboard" variant="ghost" size="lg">
              <LayoutDashboard className="h-4 w-4" />
              Explorar el panel
            </LinkBtn>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-bosque" />Validaciones anti-SSRF en servidor</span>
            <span className="inline-flex items-center gap-1.5"><Radar className="h-3.5 w-3.5 text-bosque" />Evidencia real, sin datos inventados</span>
            <span className="inline-flex items-center gap-1.5"><Scale className="h-3.5 w-3.5 text-bosque" />No es asesoría legal</span>
          </div>
        </div>
        <HeroVisualMock />
      </div>
    </section>
  );
}

function Riesgos() {
  const items = [
    { icon: Scale, title: "Un nuevo régimen ya está en agenda", text: "La Ley 21.719 chilena entra en vigor el 01-DIC-2026 y trae derechos ampliados, evaluaciones de impacto, sanciones y una Agencia fiscalizadora. Las organizaciones que inician ahora tendrán la distancia recorrida." },
    { icon: Cookie, title: "Cookies y terceros sin control", text: "Cada script de terceros y cada cookie configurada a medias es un dato tratado en nombre de tu organización. VISIBILIDAD primero: si no sabes qué corre en tu página, no puedes informarlo." },
    { icon: FileSearch, title: "Políticas que nadie verifica", text: "Tener una política publicada no garantiza que describa lo que realmente hace el sitio. La distancia entre lo declarado y lo observable es el foco de revisión." },
    { icon: ListChecks, title: "Prioridades dispersas", text: "Sin evidencia priorizada, los equipos técnicos atenúan tareas de privacidad frente a otras urgencias. Un plan clasificado por impacto/urgencia es lenguaje de gestión." },
  ];
  return (
    <section id="riesgos" className="py-20">
      <div className="container mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Los riesgos" title="Lo que se juega una organización cuando la privacidad no es medible." text="Estos son los problemas que PRIVACYOS está diseñado para hacer visibles y priorizables." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((x) => (
            <div key={x.title} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--c-bosque-soft)] text-bosque"><x.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-disp text-[16.5px] font-semibold leading-snug">{x.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-6 text-muted">{x.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  const steps = [
    { n: "01", title: "Ingresa la URL y elige normativas", text: "Validamos formato, protocolo y seguridad del destino (anti-SSRF, DNS público, puertos estándar)." },
    { n: "02", title: "Observamos evidencia real", text: "Solicitud HTTP limitada a la página inicial: cabeceras de seguridad, cookies de la primera respuesta, HTML y robots.txt." },
    { n: "03", title: "Clasificamos hallazgos", text: "Cada hallazgo distingue: confirmado · posible · riesgo técnico · información insuficiente · preventivo. Con su evidencia y limitación." },
    { n: "04", title: "Plan de acción priorizado", text: "Recomendaciones ordenadas por impacto, urgencia y esfuerzo, vinculadas a la evidencia que las respalda." },
  ];
  return (
    <section id="como-funciona" className="border-y border-line-soft bg-[color:var(--c-card)] py-20">
      <div className="container mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Cómo funciona" title="Una auditoría ligera que puedes repetir cada semana." text="Diseñado para ser consultado con frecuencia sin necesidad de proyectos largos ni rollos legales." />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card card-quiet border-line-soft p-6">
              <span className="font-disp text-[13px] font-semibold tracking-widest text-bosque">{s.n}</span>
              <h3 className="mt-4 font-disp text-[16.5px] font-semibold">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8"><Alert kind="info" title="Alcance técnico del motor 1.0">
          <p>Se inspecciona ÚNICAMENTE la página inicial del destino (sin crawling), con un límite de bytes y de tiempo configurables. Quedan fuera del alcance de esta versión: el análisis del texto de políticas, la cobertura completa de cookies de terceros y la monitorización continua.</p>
        </Alert></div>
      </div>
    </section>
  );
}

function Capacidades() {
  const items = [
    { icon: Lock, title: "Validación segura de URLs", text: "Protocolos HTTP/HTTPS, puertos estándar, bloqueo de redes privadas y de metadatos de nube, y verificación de cada redirección antes de seguirla." },
    { icon: ShieldCheck, title: "Cabeceras de seguridad", text: "HSTS, CSP, x-content-type-options, x-frame-options y referrer-policy: presencia y contenido, con la respuesta HTTP como evidencia." },
    { icon: Cookie, title: "Cookies de primera respuesta", text: "Cookies enviadas por el servidor con sus atributos HttpOnly/Secure/SameSite. El límite se declara: no cubre todos los dominios." },
    { icon: Radar, title: "Tecnologías de terceros", text: "Detección de plataformas conocidas (gtag, GTM, Meta Pixel, Clarity, Hotjar, TikTok, HubSpot y similares) en el HTML inicial." },
    { icon: FileSearch, title: "Señales de transparencia", text: "Detección de enlaces a políticas de privacidad, meta descripción, idioma declarado y robots.txt." },
    { icon: ListChecks, title: "Score explicable por dimensiones", text: "Cada dimensión con su peso, su nota y su fórmula visible; las dimensiones sin evidencia suficiente se declaran explícitamente no evaluadas." },
  ];
  return (
    <section className="py-20" id="capacidades">
      <div className="container mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Capacidades de análisis" title="Evidencia técnica real, presentada para decisiones de negocio." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x) => (
            <div key={x.title} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--c-menta-soft)] text-bosque"><x.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-disp text-[16.5px] font-semibold">{x.title}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">{x.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marcos() {
  return (
    <section id="marcos" className="border-y border-line-soft bg-[color:var(--c-card)] py-20">
      <div className="container mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Marcos normativos" title="El usuario elige la regulación; el informe vincula la evidencia." text="Solo se incluyen referencias verificables con fuentes oficiales. La aplicabilidad de cada norma depende de cada organización; PRIVACYOS relaciona, no dictamina." />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {frameworkList.map((f) => (
            <div key={f.id} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <Globe2 className="h-5 w-5 text-bosque" />
                <Pill tone={f.estado === "vigente" ? "pill-low" : "pill-med"}>{f.statusLabel}</Pill>
              </div>
              <h3 className="mt-4 font-disp text-lg font-semibold leading-snug">{f.nombre}</h3>
              <p className="text-[12px] text-muted">{f.jurisdiccion}</p>
              <p className="mt-3 text-[13.5px] leading-6 text-muted">{f.summary.split(".").slice(0, 2).join(".")}.</p>
              {f.temporalNote ? (
                <p className="mt-3 rounded-xl bg-[color:var(--c-risk-med-soft)] p-3 text-[12px] leading-5 text-[color:var(--c-risk-med)]">{f.temporalNote}</p>
              ) : null}
              <a href={f.officialRef} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-bosque">
                {f.sourceLabel} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Informe() {
  const a = sampleAnalysis;
  const f1 = a.findings[0];
  return (
    <section id="informe" className="py-20">
      <div className="container mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Informe profesional" title="Un documento que directivos y equipos técnicos pueden usar el mismo día." text="Estructura de resumen ejecutivo → hallazgos con evidencia → plan de acción. Con las limitaciones declaradas al pie." />
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="card relative p-6">
            <Pill tone="pill-sample" className="absolute -top-3 left-4">MUESTRA ILUSTRATIVA</Pill>
            <p className="eyebrow">Hallazgo de ejemplo</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="pill-high"><span className="font-semibold">{f1.status.replace("_", " ")}</span></Pill>
              <Pill tone={`pill-${f1.severity === "alto" ? "high" : "med"}`}>Severidad: {severityLabels[f1.severity]}</Pill>
              <span className="text-[12px] text-muted">Prioridad {f1.priority}</span>
            </div>
            <h3 className="mt-3 font-disp text-lg font-semibold">{f1.title}</h3>
            <p className="mt-2 text-[13.5px] leading-6 text-muted">{f1.explanation}</p>
            <div className="mt-4 grid gap-2.5">
              {f1.evidenceIds.map((id) => {
                const ev = a.evidence.find((e) => e.id === id);
                if (!ev) return null;
                return (
                  <div key={id} className="rounded-xl bg-[color:var(--c-code-bg)] p-3">
                    <p className="text-[11px] font-semibold text-muted">{id} · {ev.title}</p>
                    <p className="mt-1 break-all text-[12px] text-muted">{ev.detail}</p>
                    <p className="mt-1 text-[10.5px] text-muted opacity-80">fuente: {ev.source}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[color:var(--c-bosque-soft)] p-3.5">
              <ArrowRightLeft className="mt-0.5 h-4 w-4 flex-none text-bosque" />
              <p className="text-[13px] leading-6"><span className="font-semibold text-bosque">Recomendación:</span> {f1.recommendation}</p>
            </div>
            <p className="mt-3 text-[11.5px] text-muted">Limitación: {f1.limitation}</p>
          </div>

          <div className="grid content-start gap-4">
            {[
              { icon: ListChecks, title: "Plan de acción con prioridades", text: "Recomendaciones ordenadas por urgencia (inmediata · 30 · 90 días · continua) con impacto y esfuerzo estimados cuando existen criterios suficientes." },
              { icon: ScrollText, title: "Resumen ejecutivo y limitaciones", text: "Cada informe declara qué NO se evaluó (p. ej., retención y minimización requieren revisión del contenido y del backend)." },
              { icon: ArrowRightLeft, title: "Exportable y repetible", text: "Imprime o descarga el informe (PNG/MD/JSON) y re-analiza el mismo sitio cuando realices cambios para verificar efectos." },
            ].map((x) => (
              <div key={x.title} className="card p-6">
                <x.icon className="h-5 w-5 text-bosque" />
                <h3 className="mt-4 font-disp text-[16.5px] font-semibold">{x.title}</h3>
                <p className="mt-2 text-[13.5px] leading-6 text-muted">{x.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qa = [
    { q: "¿PRIVACYOS emite un juicio legal sobre mi organización?", a: "No. PRIVACYOS clasifica riesgos técnicos y señala relaciones indicativas con normas (Ley 19.628, Ley 21.719 y RGPD). No determina si una organización cumple la ley ni sustituye asesoría jurídica." },
    { q: "¿Qué alcanza a inspeccionar el análisis?", a: "La página inicial del destino: cabeceras HTTP de seguridad, cookies de la primera respuesta, el HTML limitado en bytes y robots.txt. No realiza crawling de rutas internas ni recolección agresiva." },
    { q: "¿Por qué aparece «información insuficiente» en lugar de un hallazgo?", a: "Por diseño honesto. La ausencia de evidencia no prueba incumplimiento. Cuando algo no puede determinarse (p. ej., retención de datos), el informe lo declara y recomienda el paso siguiente de revisión humana." },
    { q: "¿La Ley 21.719 ya está vigente?", a: "Aún no al día de esta versión: se publicó el 13-DIC-2024 y según el texto oficial entra en vigor el 01-DIC-2026 (verificado en LeyChile). Hasta esa fecha rige transitoriamente la Ley 19.628. PRIVACYOS usa 21.719 como marco preparatorio y lo identifica así." },
    { q: "¿Dónde se guardan mis análisis?", a: "En el almacenamiento local de tu navegador (localStorage). No hay base de datos ni cuentas en esta fase; vaciar datos del navegador elimina el historial. La persistencia de servidor está planificada para la fase 2." },
    { q: "¿Se pueden analizar URLs internas o con puerto no estándar?", a: "No. Por diseño de seguridad, solo direcciones HTTP/HTTPS públicas en puertos estándar (80/443). El motor resuelve DNS y bloquea destinos hacia redes privadas, servicios internos o metadatos de nube." },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-line-soft bg-[color:var(--c-card)] py-20">
      <div className="container mx-auto max-w-3xl px-5">
        <SectionHead eyebrow="Preguntas frecuentes" title="Las respuestas claras primero." align="center" />
        <div className="mt-10 grid gap-3">
          {qa.map((x, i) => (
            <div key={x.q} className="card overflow-hidden p-0">
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" aria-expanded={openIdx === i}>
                <span className="font-disp text-[15.5px] font-semibold">{x.q}</span>
                <span className={`grid h-7 w-7 flex-none place-items-center rounded-full bg-[color:var(--c-bosque-soft)] text-bosque transition-transform ${openIdx === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openIdx === i ? <p className="px-6 pb-6 text-[14px] leading-7 text-muted">{x.a}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-4xl px-5">
        <div className="card relative overflow-hidden p-10 text-center md:p-14">
          <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-full max-w-md rounded-full bg-[color:var(--c-bosque-soft)] blur-3xl" />
          <div className="relative">
            <BrandMark/>
            <h2 className="mx-auto mt-5 max-w-xl font-disp text-3xl font-semibold tracking-tight sm:text-4xl">
              Tu primer informe de privacidad en un clic.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-muted">
              Analiza un sitio ahora o explora el panel con el informe de muestra (marcado como ilustrativo).
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkBtn href="/app/nuevo" size="lg"><Search className="h-4 w-4" />Analizar un sitio</LinkBtn>
              <LinkBtn href="/app/informe/PS-SAMPLE" variant="ghost" size="lg">Ver informe de muestra</LinkBtn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandMark() {
  return (
    <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-bosque font-disp text-lg font-bold text-white dark:text-[#10231b]">P</span>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-[color:var(--c-card)]">
      <div className="container mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-muted">
            Inteligencia práctica para la privacidad digital. Prototipo profesional en revisión continua —Sin asesoría legal—.
          </p>
          <p className="mt-4 text-[12px] text-muted">
            Referencia normativa: <a href={FRAMEWORKS["CL-21719"].officialRef} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">Ley 21.719 (leychile.cl)</a> · entra en vigor 01-DIC-2026.
          </p>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Producto</p>
          <div className="mt-3 grid gap-2 text-[13px] text-muted">
            <Link href="/app/nuevo" className="hover:text-ink">Nuevo análisis</Link>
            <Link href="/app/dashboard" className="hover:text-ink">Panel</Link>
            <Link href="/app/regulatorio" className="hover:text-ink">Inteligencia regulatoria</Link>
            <Link href="/app/derechos" className="hover:text-ink">Centro de derechos</Link>
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Contacto</p>
          <div className="mt-3 grid gap-2 text-[13px] text-muted">
            <a href="mailto:contacto@privacyos.cl" className="hover:text-ink">contacto@privacyos.cl</a>
            <span>Estado del motor: v1.0.0-sereno (Hito 1)</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line-soft px-5 py-5">
        <p className="container mx-auto max-w-6xl text-center text-[11.5px] text-muted">
          © {new Date().getFullYear()} PRIVACYOS · Prototipo profesional · Los resultados de análisis reflejan observaciones técnicas de la fecha de ejecución y no constituyen un dictamen legal.
        </p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <Riesgos />
        <ComoFunciona />
        <Capacidades />
        <Marcos />
        <Informe />
        <Faq />
        <CtaFinal />
      </main>
      <SiteFooter />
    </div>
  );
}
