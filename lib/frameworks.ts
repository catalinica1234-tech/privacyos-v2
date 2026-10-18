import type { FrameworkId } from "./contracts";

/* ═════════════════════════════════════════════════════════════════
   Marcadores normativos de PRIVACYOS.
   Solo se incluyen referencias verificables y fuentes oficiales.
   La aplicabilidad real depende de jurisdicción, actividades y
   circunstancias: PRIVACYOS no determina cumplimiento legal.
   ═════════════════════════════════════════════════════════════════ */

export interface FrameworkRequirement {
  id: string;
  title: string;
  /** Referencia indicativa a la disposición relevante. */
  ref: string;
  refUrl?: string;
  description: string;
}

export interface FrameworkMeta {
  id: FrameworkId;
  nombre: string;
  jurisdiccion: string;
  /** Estado vigente verificable al día del motor. */
  estado: "vigente" | "vigencia_diferida";
  statusLabel: string;
  statusDetail: string;
  officialRef: string;
  sourceLabel: string;
  summary: string;
  applicability: string;
  temporalNote?: string;
  requirements: FrameworkRequirement[];
  signals: string[]; // señales técnicas que el motor observa para este marco
}

export const FRAMEWORKS: Record<FrameworkId, FrameworkMeta> = {
  "CL-1928": {
    id: "CL-1928",
    nombre: "Ley N.º 19.628",
    jurisdiccion: "Chile",
    estado: "vigente",
    statusLabel: "Vigente hoy en Chile",
    statusDetail:
      "Es la norma de protección de datos personales vigente en Chile en la fecha de esta versión del motor, hasta la entrada en vigor de la Ley 21.719.",
    officialRef: "https://www.bcn.cl/leychile/navegar?idNorma=8730",
    sourceLabel: "Texto oficial — LeyChile (BCN)",
    summary:
      "Regula el tratamiento de datos personales en registros o bancos de datos públicos y privados, estableciendo obligaciones de información, seguridad y los derechos de acceso, rectificación, cancelación y bloqueo.",
    applicability:
      "Aplica a tratamientos de datos personales realizados en Chile por personas naturales o jurídicas, con las excepciones legales existentes.",
    requirements: [
      {
        id: "1928-info",
        title: "Información al titular del dato",
        ref: "Ley 19.628, art. 14",
        refUrl: "https://www.bcn.cl/leychile/navegar?idNorma=8730",
        description:
          "El titular debe ser informado del tratamiento al que se someten sus datos y de la finalidad perseguida.",
      },
      {
        id: "1928-arco",
        title: "Derechos de acceso, rectificación, cancelación y bloqueo",
        ref: "Ley 19.628, arts. 11–14",
        refUrl: "https://www.bcn.cl/leychile/navegar?idNorma=8730",
        description:
          "El titular puede solicitar información sobre el tratamiento, y la rectificación o cancelación de datos cuando corresponda.",
      },
      {
        id: "1928-seguridad",
        title: "Medidas de seguridad técnica y física",
        ref: "Ley 19.628, art. 18",
        refUrl: "https://www.bcn.cl/leychile/navegar?idNorma=8730",
        description:
          "Los responsables deben adoptar medidas de seguridad para garantizar la protección y confidencialidad de los datos.",
      },
      {
        id: "1928-sensibles",
        title: "Tratamiento de datos sensibles",
        ref: "Ley 19.628, art. 2 y ss.",
        refUrl: "https://www.bcn.cl/leychile/navegar?idNorma=8730",
        description:
          "El tratamiento de datos sensibles tiene reglas específicas y limitaciones reforzadas.",
      },
    ],
    signals: ["hsts", "cabeceras_csp", "enlace_politica", "cookies", "terceros"],
  },

  "CL-21719": {
    id: "CL-21719",
    nombre: "Ley N.º 21.719",
    jurisdiccion: "Chile",
    estado: "vigencia_diferida",
    statusLabel: "Entra en vigor el 01-DIC-2026",
    statusDetail:
      "Promulgada el 25-NOV-2024 y publicada el 13-DIC-2024, con vigencia diferida al 01-DIC-2026. En la fecha de esta versión aún rige transitoriamente la Ley 19.628.",
    officialRef: "https://www.leychile.cl/leychile/navegar?idNorma=1209272",
    sourceLabel: "Texto oficial — LeyChile (BCN)",
    summary:
      "Nueva ley chilena de protección y tratamiento de datos personales: crea la Agencia de Protección de Datos Personales, un modelo orientado a la adecuada información de titulares con derechos ampliados (acceso, rectificación, cancelación, oposición y portabilidad), la acreditación de la licitud del tratamiento, evaluaciones de impacto y el Registro Nacional de Sanciones y Cumplimiento.",
    applicability:
      "Aplica a tratamientos realizados en Chile y a operaciones destinadas a ofrecer bienes o servicios a titulares en territorio nacional (art. 1 bis). Su aplicabilidad concreta depende de cada organización.",
    temporalNote:
      "Antes del 01-DIC-2026 la referencia operativa para evaluaciones es la Ley 19.628. PRIVACYOS asocia los hallazgos a 21.719 a título preparatorio, sin afirmar que determine incumplimientos.",
    requirements: [
      {
        id: "21719-licitud",
        title: "Acreditación de la licitud del tratamiento",
        ref: "Ley 21.719, art. 13 (texto consolidado)",
        refUrl: "https://www.leychile.cl/leychile/navegar?idNorma=1209272",
        description:
          "El responsable deberá acreditar la licitud del tratamiento de datos personales.",
      },
      {
        id: "21719-derechos",
        title: "Derechos ampliados de los titulares (ARCO/P)",
        ref: "Ley 21.719 (texto consolidado, parte preliminar)",
        refUrl: "https://www.leychile.cl/leychile/navegar?idNorma=1209272",
        description:
          "Derechos de acceso, rectificación, cancelación, oposición y portabilidad de datos personales.",
      },
      {
        id: "21719-seguridad",
        title: "Seguridad del tratamiento",
        ref: "Ley 21.719 (obligaciones de medidas de seguridad)",
        refUrl: "https://www.leychile.cl/leychile/navegar?idNorma=1209272",
        description:
          "Los responsables deben adoptar medidas de seguridad adecuadas para proteger los datos personales tratados.",
      },
      {
        id: "21719-eipd",
        title: "Evaluaciones de impacto",
        ref: "Ley 21.719 (evaluación de impacto relativa a protección de datos)",
        refUrl: "https://www.leychile.cl/leychile/navegar?idNorma=1209272",
        description:
          "La Agencia publicará una lista orientativa de operaciones que requieren evaluación de impacto; ciertos tratamientos exigirán AEIPD.",
      },
      {
        id: "21719-contacto",
        title: "Datos de contacto para titulares y la Agencia",
        ref: "Ley 21.719 (responsables sin domicilio en Chile)",
        refUrl: "https://www.leychile.cl/leychile/navegar?idNorma=1209272",
        description:
          "Los responsables sin domicilio en Chile deben señalar y mantener actualizado un medio de contacto idóneo para titulares y para la Agencia.",
      },
    ],
    signals: ["hsts", "cabeceras_csp", "enlace_politica", "cookies", "terceros", "contacto_dpo"],
  },

  GDPR: {
    id: "GDPR",
    nombre: "RGPD / GDPR (Reglamento UE 2016/679)",
    jurisdiccion: "Unión Europea",
    estado: "vigente",
    statusLabel: "Vigente en la UE",
    statusDetail:
      "Reglamento vigente en la Unión Europea desde 2018, con aplicación extraterritorial en los casos del art. 3.",
    officialRef: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32016R0679",
    sourceLabel: "Texto oficial — EUR-Lex",
    summary:
      "Reglamento europeo de protección de datos: principios de licitud, informaciones a interesados, derechos de los interesados, seguridad del tratamiento y privada por diseño.",
    applicability:
      "Aplica, entre otros supuestos, cuando el tratamiento tiene lugar en la UE, u ofreciendo bienes o servicios a interesados situados en la UE (art. 3). No todo sitio web está sujeto al RGPD: la aplicabilidad depende de circunstancias concretas.",
    requirements: [
      {
        id: "gdpr-info",
        title: "Información e interoperabilidad con el interesado",
        ref: "Reglamento (UE) 2016/679, arts. 12–14",
        refUrl: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32016R0679",
        description:
          "Información concisa, transparente e inteligible sobre el tratamiento cuando se obtienen datos del interesado.",
      },
      {
        id: "gdpr-arco",
        title: "Derechos de los interesados (acceso, supresión, portabilidad, oposición…)",
        ref: "Reglamento (UE) 2016/679, arts. 15–21",
        refUrl: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32016R0679",
        description:
          "Derechos de acceso (art. 15), rectificación (16), supresión (17), limitación (18), portabilidad (20) y oposición (21).",
      },
      {
        id: "gdpr-seguridad",
        title: "Seguridad del tratamiento",
        ref: "Reglamento (UE) 2016/679, art. 32",
        refUrl: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32016R0679",
        description:
          "Medidas técnicas y organizativas apropiadas según el riesgo, incluido el seudonimización y cifrado.",
      },
      {
        id: "gdpr-minimizacion",
        title: "Minimización de datos y privacy por diseño",
        ref: "Reglamento (UE) 2016/679, arts. 5.1.c y 25",
        refUrl: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32016R0679",
        description:
          "Limitación de datos y medidas de privacidad por diseño por defecto en los sistemas.",
      },
    ],
    signals: ["hsts", "cabeceras_csp", "enlace_politica", "cookies", "terceros"],
  },
};

export const frameworkList: FrameworkMeta[] = [
  FRAMEWORKS["CL-1928"],
  FRAMEWORKS["CL-21719"],
  FRAMEWORKS.GDPR,
];

export function getFramework(id: FrameworkId): FrameworkMeta {
  return FRAMEWORKS[id];
}

export function frameworkNombre(id: FrameworkId): string {
  return FRAMEWORKS[id]?.nombre ?? id;
}
