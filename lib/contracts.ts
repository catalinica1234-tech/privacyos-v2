import { z } from "zod";

/* ═════════════════════════════════════════════════════════════════
   Contratos tipados de PRIVACYOS (compartidos entre UI y motor).
   Todo resultado de análisis pasa por aquí: el API produce datos que
   cumplen estos esquemas y la UI valida antes de renderizar.
   ═════════════════════════════════════════════════════════════════ */

/* ── Marcos normativos ── */
export const FrameworkId = z.enum(["CL-1928", "CL-21719", "GDPR"]);
export type FrameworkId = z.infer<typeof FrameworkId>;

export const analysisModes = z.enum(["live", "sample"]);
export type AnalysisMode = z.infer<typeof analysisModes>;

/* ── Evidencias ── */
export const Evidence = z.object({
  id: z.string(),                // EV-001…
  kind: z.enum(["http", "header", "cookie", "html", "dns", "robots", "sistema"]),
  title: z.string(),
  detail: z.string(),            // descripción técnica de lo observado
  source: z.string(),            // URL de origen (o "proceso interno")
  observedAt: z.string(),        // ISO date
});
export type Evidence = z.infer<typeof Evidence>;

/* ── Hallazgos ──
   status distingue honestamente: confirmado (evidencia suficiente),
   posible (requiere revisión humana), riesgo_tecnico (observación
   técnica, no es un incumplimiento por sí), insuficiente (no se puede
   determinar) y preventivo (recomendación proactiva). */
export const FindingStatus = z.enum([
  "confirmado",
  "posible",
  "riesgo_tecnico",
  "insuficiente",
  "preventivo",
]);
export type FindingStatus = z.infer<typeof FindingStatus>;

export const Severity = z.enum(["bajo", "medio", "alto", "critico"]);
export type Severity = z.infer<typeof Severity>;

export const FrameworkRef = z.object({
  id: FrameworkId,
  /** Artículo/provisión de referencia (indicativa, no una opinión legal). */
  ref: z.string(),
  /** Por qué este hallazgo se relaciona con la norma. */
  relation: z.string(),
});
export type FrameworkRef = z.infer<typeof FrameworkRef>;

export const Finding = z.object({
  id: z.string(),                                   // F-01…
  title: z.string(),
  status: FindingStatus,
  severity: Severity,
  category: z.enum(["seguridad", "transparencia", "terceros", "retencion", "gobernanza"]),
  explanation: z.string(),
  businessImpact: z.string(),
  evidenceIds: z.array(z.string()).min(1),
  frameworks: z.array(FrameworkRef).default([]),
  recommendation: z.string(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  limitation: z.string().default(""),               // qué NO afirma este hallazgo
});
export type Finding = z.infer<typeof Finding>;

/* ── Dimensiones del score ── */
export const Dimension = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number().min(0).max(100),   // 0–100
  weight: z.number().min(0).max(1),    // peso en el total
  evaluated: z.boolean(),              // false = sin evidencia suficiente
  note: z.string().default(""),
});
export type Dimension = z.infer<typeof Dimension>;

/* ── Recomendaciones ── */
export const Recommendation = z.object({
  id: z.string(),
  title: z.string(),
  action: z.string(),
  relatedFindingId: z.string().optional(),
  impact: z.enum(["alto", "medio", "bajo"]),
  urgencia: z.enum(["inmediata", "30_dias", "90_dias", "continua"]),
  effort: z.enum(["bajo", "medio", "alto"]),
});
export type Recommendation = z.infer<typeof Recommendation>;

/* ── Análisis completo ── */
export const AccessibilityInfo = z.object({
  reachable: z.boolean(),
  finalUrl: z.string().nullable(),
  httpStatus: z.number().nullable(),
  redirects: z.array(z.string()).default([]),
  responseBytes: z.number().nullable(),
  durationMs: z.number().nullable(),
});
export type AccessibilityInfo = z.infer<typeof AccessibilityInfo>;

export const Analysis = z.object({
  id: z.string(),                                  // PS-XXXXXX
  dataMode: analysisModes,                        // live (real) | sample (ilustrativo)
  createdAt: z.string(),
  engineVersion: z.string(),
  input: z.object({ url: z.string().url(), host: z.string(), frameworkIds: z.array(FrameworkId) }),
  accessibility: AccessibilityInfo,
  dimensions: z.array(Dimension),
  score: z.number().min(0).max(100),
  riskLevel: Severity.nullable(),
  evidence: z.array(Evidence),
  findings: z.array(Finding),
  recommendations: z.array(Recommendation),
  engineNotes: z.array(z.string()).default([]),    // limitaciones del motor en esta corrida
});
export type Analysis = z.infer<typeof Analysis>;

/* ── Peticiones ── */
export const analyzeRequestSchema = z.object({
  id: z
    .string()
    .regex(/^PS-[A-Z0-9]{6}$/, "Formato de identificador inválido")
    .optional(),
  url: z.string().min(4).max(2048),
  frameworkIds: z.array(FrameworkId).min(1),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const analyzeResponse = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), analysis: Analysis }),
  z.object({
    ok: z.literal(false),
    code: z.enum([
      "URL_INVALIDA",
      "PROTOCOLO_NO_PERMITIDO",
      "DESTINO_NO_SEGURO",
      "SITIO_INACCESIBLE",
      "DESCONECTADO",
      "ERROR_INTERNO",
    ]),
    message: z.string(),
    hint: z.string(),
  }),
]);
export type AnalyzeResponse = z.infer<typeof analyzeResponse>;

/* ── Hito 2 · Contratos REST (recursos sites y analyses) ── */

export const siteCreateSchema = z
  .object({
    url: z
      .string()
      .max(2048)
      .url()
      .refine((u) => u.startsWith("http://") || u.startsWith("https://"), "Solo http/https"),
    nombre: z.string().min(1).max(120).optional(),
    notas: z.string().max(2000).optional(),
  });
export type SiteCreateInput = z.infer<typeof siteCreateSchema>;

export const siteUpdateSchema = siteCreateSchema.partial();
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;

export const analysisCreateSchema = analyzeRequestSchema.extend({
  siteId: z.string().cuid().optional(),
});
export type AnalysisCreateInput = z.infer<typeof analysisCreateSchema>;

export const analysisUpdateSchema = z
  .object({
    notas: z.string().max(2000).nullable().optional(),
    revisado: z.boolean().optional(),
  })
  .refine((d) => d.notas !== undefined || d.revisado !== undefined, "Envía al menos un campo.");
export type AnalysisUpdateInput = z.infer<typeof analysisUpdateSchema>;

/* ── Hito 2 · Asistente explicativo (IA) ── */

export const assistantRequestSchema = z.object({
  question: z.string().min(3).max(600),
  // El cliente envía el informe YA cargado (localStorage, muestra o API).
  // El servidor lo valida con el mismo contrato: nunca fictea contenido.
  analysis: Analysis,
});
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export const assistantResponse = z.union([
  z.object({
    ok: z.literal(true),
    answer: z.string(),
    disclaimer: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
    hint: z.string().optional(),
  }),
]);
export type AssistantResponse = z.infer<typeof assistantResponse>;

/* ── Preferencias locales ── */
export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  contrast: z.enum(["normal", "alto"]),
});
export type Preferences = z.infer<typeof preferencesSchema>;
