"use client";

import { useState } from "react";
import { ClipboardCopy, ExternalLink, FileText, HandHeart, Lock, MailCheck, SearchCheck, Trash2 } from "lucide-react";
import { FRAMEWORKS } from "@/lib/frameworks";
import { copyToClipboard } from "@/lib/export";
import { Alert, LinkBtn, Pill } from "@/components/ui";

/* ═════════════════════════════════════════════════════════════════
   Centro de derechos de privacidad.
   Plantillas ORIENTATIVAS, redactadas con bases normativas ciudadanas;
   no constituyen asesoría legal y no reemplazan la revisión de cada caso.
   ═════════════════════════════════════════════════════════════════ */

interface RightDef {
  id: string;
  icon: (props: { className?: string }) => React.ReactNode;
  nombre: string;
  desc: string;
  bases: Array<{ id: keyof typeof FRAMEWORKS; ref: string }>;
  template: string;
}

const RIGHTS: RightDef[] = [
  {
    id: "acceso",
    icon: (p) => <SearchCheck {...p} />,
    nombre: "Acceso",
    desc: "Solicitar información sobre qué datos tuyos fueron tratados y a qué fines.",
    bases: [
      { id: "CL-1928", ref: "Ley 19.628, art. 11" },
      { id: "GDPR", ref: "Reglamento (UE) 2016/679, art. 15" },
    ],
    template: `Estimado responsable de tratamiento:\n\nDe conformidad con la normativa de protección de datos personales que resulte aplicable, solicito información sobre el tratamiento que usted hace de mis datos personales, incluyendo las categorías de datos, las finalidades, los destinatarios o terceros con quienes se hayan compartido y el origen de los mismos.\n\nDatos de identificación: (agregar nombre, identificación y datos de contacto)\nServicio o sitio: (denominación exacta)\n\nAtentamente,\n(insertar nombre y firma si corresponde)`,
  },
  {
    id: "rectificacion",
    icon: (p) => <FileText {...p} />,
    nombre: "Rectificación",
    desc: "Pedir la modificación de datos inexactos o incompletos.",
    bases: [
      { id: "CL-1928", ref: "Ley 19.628, art. 12" },
      { id: "GDPR", ref: "Reglamento (UE) 2016/679, art. 16" },
    ],
    template: `Estimado responsable de tratamiento:\n\nEn ejercicio del derecho de rectificación, solicito la actualización o corrección de los siguientes datos personales tratados por tu organización:\n\n• Dato actual: (valor erróneo)\n• Dato correcto: (valor correcto)\n• Justificación / comprobante: (adjuntar)\n\nDatos de identificación: (agregar)\n\nAtentamente,\n(Nombre)`,
  },
  {
    id: "cancelacion",
    icon: (p) => <Trash2 {...p} />,
    nombre: "Cancelación o supresión",
    desc: "Pedir la eliminación de datos cuando corresponda según la ley aplicable.",
    bases: [
      { id: "CL-1928", ref: "Ley 19.628, art. 12" },
      { id: "GDPR", ref: "Reglamento (UE) 2016/679, art. 17" },
    ],
    template: `Estimado responsable de tratamiento:\n\nEn ejercicio del derecho de cancelación/supresión, solicito la eliminación o el cese del tratamiento de los siguientes datos personales:\n\n• Datos: (describir)\n• Motivo: (razón/es)\n\nDejo constancia de que este ejercicio no afecta a los datos sujetos a conservación por obligaciones legales (a evaluar por el responsable), en cuyo caso solicito el bloqueo correspondiente.\n\nDatos de identificación: (agregar)\n\nAtentamente,\n(nombre)`,
  },
  {
    id: "oposicion",
    icon: (p) => <Lock {...p} />,
    nombre: "Oposición y limitación",
    desc: "Oponerse a ciertos tratamientos o solicitar su limitación.",
    bases: [
      { id: "CL-21719", ref: "Ley 21.719 (derechos de los titulares; texto consolidado)" },
      { id: "GDPR", ref: "Reglamento (UE) 2016/679, arts. 18 y 21" },
    ],
    template: `Estimado responsable de tratamiento:\n\nEn ejercicio del derecho de oposición, comunico mi voluntad de oponerme o de solicitar la limitación del tratamiento de mis datos personales respecto de:\n\n• Tratamiento: (comunicación comercial / publicidad / otro)\n\nSolicito el cese inmediato y la confirmación por escrito.\n\nDatos de identificación: (agregar)\n\nAtentamente,\n(nombre)`,
  },
  {
    id: "portabilidad",
    icon: (p) => <MailCheck {...p} />,
    nombre: "Portabilidad",
    desc: "Solicitar la entrega de tus datos en un formato estructurado y legible.",
    bases: [
      { id: "CL-21719", ref: "Ley 21.719 (derecho de portabilidad; texto consolidado)" },
      { id: "GDPR", ref: "Reglamento (UE) 2016/679, art. 20" },
    ],
    template: `Estimado responsable de tratamiento:\n\nEn ejercicio del derecho de portabilidad, solicito la entrega de mis datos personales en un formato estructurado y comúnmente usado (p. ej., CSV o JSON), incluyendo los datos que hayan facilitado y derivados del contrato o consentimiento.\n\nDatos de identificación: (agregar)\n\nAtentamente,\n(Nombre)`,
  },
];

export default function DerechosPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, text: string) => {
    if (await copyToClipboard(text)) {
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Centro de derechos</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Ejerce tus derechos ante cualquier responsable</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-muted">
          Plantillas listas para copiar y enviar. Las bases normativas se muestran con referencias indicativas; la
          aplicación concreta de cada derecho depende de la norma y del caso.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {RIGHTS.map((r) => (
          <section key={r.id} className="card p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--c-bosque-soft)] text-bosque">{r.icon({ className: "h-5 w-5" })}</div>
            <h2 className="mt-4 font-disp text-[15.5px] font-semibold">{r.nombre}</h2>
            <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{r.desc}</p>
            <div className="mt-3 grid gap-1">
              {r.bases.map((b) => (
                <p key={b.ref} className="text-[11.5px] text-muted">
                  <span className="font-medium text-bosque">{FRAMEWORKS[b.id]?.nombre ?? b.id}</span> · {b.ref}
                </p>
              ))}
            </div>
            <button onClick={() => copy(r.id, r.template)} className="btn btn-ghost btn-sm mt-4 w-full">
              <ClipboardCopy className="h-3.5 w-3.5" />{copied === r.id ? "Plantilla copiada" : "Copiar plantilla"}
            </button>
          </section>
        ))}
      </div>

      <Alert kind="info" title="Cómo usar las plantillas">
        <ol className="mx-4 list-decimal space-y-1.5">
          <li>Identifica al responsable del tratamiento: revisa la política de privacidad del sitio (ejecuta un análisis PRIVACYOS para encontrar el enlace).</li>
          <li>Agrega tus datos de identificación y detalles del caso en los campos indicados.</li>
          <li>Envíala por los canales oficiales de contacto del responsable y guarda pruebas de envío.</li>
          <li>Si no hay respuesta, revisa canales de reclamo ante la autoridad competente de tu jurisdicción.</li>
        </ol>
      </Alert>

      <div className="card card-quiet p-5">
        <h2 className="font-disp text-[15px] font-semibold">Referencias oficiales</h2>
        <div className="mt-3 grid gap-2">
          {Object.values(FRAMEWORKS).map((f) => (
            <a key={f.id} href={f.officialRef} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-[13px] text-bosque">
              {f.nombre} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Pill tone="pill-neutral"><HandHeart className="h-3 w-3" />Plantillas orientativas · no constituyen asesoría legal</Pill>
        <LinkBtn href="/app/nuevo" size="sm">Analizar un sitio ahora</LinkBtn>
      </div>
    </div>
  );
}
