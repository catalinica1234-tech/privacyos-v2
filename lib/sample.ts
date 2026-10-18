import type { Analysis } from "./contracts";

/* ═════════════════════════════════════════════════════════════════
   DATASET ILUSTRATIVO (dataMode: "sample").
   NO corresponde a resultados de ningún sitio real: existe para
   explorar la interfaz sin red (p. ej., en demostraciones con
   conexión restringida). La interfaz lo marca siempre con la píldora
   «MUESTRA ILUSTRATIVA» y no lo mezcla con análisis reales.
   ═════════════════════════════════════════════════════════════════ */

export const sampleAnalysis: Analysis = {
  id: "PS-SAMPLE",
  dataMode: "sample",
  createdAt: new Date().toISOString(),
  engineVersion: "ejemplo-estatico",
  input: { url: "https://ejemplo-ilustrativo.cl", host: "ejemplo-ilustrativo.cl", frameworkIds: ["CL-1928", "CL-21719", "GDPR"] },
  accessibility: {
    reachable: true,
    finalUrl: "https://ejemplo-ilustrativo.cl",
    httpStatus: 200,
    redirects: [],
    responseBytes: 98_304,
    durationMs: 640,
  },
  dimensions: [
    { id: "seguridad", label: "Seguridad técnica", value: 71, weight: 0.3, evaluated: true, note: "HTTPS sí · HSTS no · CSP sí." },
    { id: "transparencia", label: "Transparencia de la información", value: 82, weight: 0.25, evaluated: true, note: "Enlace a política detectado." },
    { id: "terceros", label: "Intercambio con terceros", value: 64, weight: 0.2, evaluated: true, note: "3 tecnologías identificadas (ilustrativo)." },
    { id: "gobernanza", label: "Gobernanza básica", value: 85, weight: 0.1, evaluated: true, note: "robots.txt disponible (ilustrativo)." },
    { id: "retencion", label: "Retención y minimización", value: 0, weight: 0.15, evaluated: false, note: "Dimensión no evaluada por el motor de Hito 1." },
  ],
  score: 74,
  riskLevel: "medio",
  evidence: [
    { id: "EV-001", kind: "http", title: "Respuesta HTTP 200", detail: "Solicitud GET completada en 640 ms. Sin redirecciones usadas.", source: "https://ejemplo-ilustrativo.cl", observedAt: new Date().toISOString() },
    { id: "EV-002", kind: "header", title: "Cabeceras de seguridad observadas", detail: "Presentes: content-security-policy. Ausentes: strict-transport-security, x-content-type-options, x-frame-options, referrer-policy.", source: "https://ejemplo-ilustrativo.cl", observedAt: new Date().toISOString() },
    { id: "EV-003", kind: "html", title: "Tecnologías de terceros detectadas", detail: "Google Tag Manager (2 referencias) · Google Analytics (1) · Meta Pixel (1). Contenido ilustrativo.", source: "https://ejemplo-ilustrativo.cl", observedAt: new Date().toISOString() },
    { id: "EV-004", kind: "cookie", title: "Cookie «sess_id» observada", detail: "Atributos declarados: HttpOnly. Sin Secure ni SameSite. Contenido ilustrativo.", source: "https://ejemplo-ilustrativo.cl", observedAt: new Date().toISOString() },
    { id: "EV-005", kind: "robots", title: "robots.txt disponible", detail: "Estado HTTP 200; 1 mapa del sitio declarado. Contenido ilustrativo.", source: "https://ejemplo-ilustrativo.cl/robots.txt", observedAt: new Date().toISOString() },
  ],
  findings: [
    {
      id: "F-01",
      title: "Cookies de sesión con atributos de seguridad incompletos",
      status: "riesgo_tecnico",
      severity: "alto",
      category: "seguridad",
      explanation: "La cookie de sesión sin Secure permite su transmisión por canales no cifrados en ciertas rutas (escenario ilustrativo).",
      businessImpact: "Riesgo técnico de intercepción de identificadores de sesión en redes no confiables.",
      evidenceIds: ["EV-004"],
      frameworks: [
        { id: "CL-1928", ref: "Ley 19.628, art. 18", relation: "Relación indicativa con medidas de seguridad (Ley vigente)." },
        { id: "CL-21719", ref: "Ley 21.719 (obligaciones de medidas de seguridad)", relation: "Relación preparatoria; vigencia 01-DIC-2026." },
        { id: "GDPR", ref: "Reglamento (UE) 2016/679, art. 32", relation: "Relación indicativa con el RGPD." },
      ],
      recommendation: "Configura las cookies de sesión con Secure, HttpOnly y SameSite=Lax o Strict.",
      priority: "P2",
      limitation: "Contenido ilustrativo; no describe a ningún sitio real.",
    },
    {
      id: "F-02",
      title: "Sin cabecera Strict-Transport-Security (HSTS)",
      status: "riesgo_tecnico",
      severity: "medio",
      category: "seguridad",
      explanation: "El sitio no fuerza conexiones exclusivamente seguras (escenario ilustrativo).",
      businessImpact: "Una primera visita podría procesarse por HTTP antes de la redirección a HTTPS.",
      evidenceIds: ["EV-002"],
      frameworks: [{ id: "GDPR", ref: "Reglamento (UE) 2016/679, art. 32", relation: "Relación indicativa con medidas técnicas apropiadas." }],
      recommendation: "Añade la cabecera Strict-Transport-Security (max-age ≥ 31536000).",
      priority: "P2",
      limitation: "Contenido ilustrativo.",
    },
    {
      id: "F-03",
      title: "Tecnologías de terceros en la página inicial (3)",
      status: "riesgo_tecnico",
      severity: "medio",
      category: "terceros",
      explanation: "Google Tag Manager, Google Analytics y Meta Pixel aparecen en el HTML inicial (escenario ilustrativo).",
      businessImpact: "Procesamiento de datos por terceros en nombre del responsable: debe informarse y documentarse (relación indicativa).",
      evidenceIds: ["EV-003"],
      frameworks: [
        { id: "CL-1928", ref: "Ley 19.628, art. 14", relation: "Relación indicativa con el deber de informar al titular." },
        { id: "GDPR", ref: "Reglamento (UE) 2016/679, arts. 12–14", relation: "Relación indicativa con la información al interesado." },
      ],
      recommendation: "Documenta cada tecnología de terceros y verifica que la política de privacidad la describa.",
      priority: "P2",
      limitation: "No se comparó con el contenido declarado del sitio: la consistencia requiere revisión humana. Contenido ilustrativo.",
    },
    {
      id: "F-04",
      title: "Sin cabeceras de refuerzo ausentes",
      status: "riesgo_tecnico",
      severity: "bajo",
      category: "seguridad",
      explanation: "No se observaron X-Content-Type-Options, X-Frame-Options ni Referrer-Policy (escenario ilustrativo).",
      businessImpact: "Debilidad menor frente a codificación de contenido errónea y encuadramiento no autorizado.",
      evidenceIds: ["EV-002"],
      frameworks: [],
      recommendation: "Agrega X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN y Referrer-Policy.",
      priority: "P3",
      limitation: "Contenido ilustrativo.",
    },
  ],
  recommendations: [
    { id: "R-01", title: "Configurar cookies de sesión de forma segura", action: "Habilita Secure, HttpOnly y SameSite en las cookies de sesión y revisa su expiración.", relatedFindingId: "F-01", impact: "alto", urgencia: "30_dias", effort: "bajo" },
    { id: "R-02", title: "Añadir la cabecera HSTS", action: "Publica Strict-Transport-Security con max-age ≥ 31536000.", relatedFindingId: "F-02", impact: "medio", urgencia: "30_dias", effort: "bajo" },
    { id: "R-03", title: "Documentar las tecnologías de terceros", action: "Registra finalidad, datos tratados y sede de cada procesador, y sincroniza la política de privacidad.", relatedFindingId: "F-03", impact: "alto", urgencia: "90_dias", effort: "medio" },
    { id: "R-04", title: "Completar cabeceras de refuerzo", action: "Incorpora nosniff, SAMEORIGIN y Referrer-Policy.", relatedFindingId: "F-04", impact: "bajo", urgencia: "90_dias", effort: "bajo" },
  ],
  engineNotes: [
    "ALTO: este análisis es una MUESTRA ILUSTRATIVA. No se ejecutó ninguna solicitud HTTP y no describe al servicio denominado ejemplo-ilustrativo.cl.",
    "Existe para permitir explorar la interfaz sin conexión externa (demostraciones con red restringida).",
    "Los hallazgos muestran el formato real del informe: estado, severidad, evidencia, relación normativa, recomendación y limitaciones.",
  ],
};
