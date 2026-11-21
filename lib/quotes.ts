import { z } from "zod";

export const segments = [
  { id: "personal", label: "Personal", detail: "Revisar un sitio y entender sus hallazgos." },
  { id: "profesional", label: "Profesional", detail: "Comparar revisiones y preparar informes para tus proyectos." },
  { id: "business", label: "Business", detail: "Definir el alcance para varios sitios y priorizar mejoras." },
  { id: "institucional", label: "Institucional", detail: "Acordar requisitos, frecuencia y cobertura de la evaluación." },
] as const;

export const quoteSchema = z.object({
  requestId: z.string().uuid(),
  segment: z.enum(["personal", "profesional", "business", "institucional"]),
  name: z.string().trim().min(2, "Ingresa tu nombre.").max(100),
  email: z.string().trim().max(254).email("Ingresa un correo válido.").toLowerCase(),
  organization: z.string().trim().max(140).optional(),
  sites: z.enum(["1", "2-5", "6-20", "21+"]),
  need: z.string().trim().min(10, "Describe tu necesidad en al menos 10 caracteres.").max(800),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
}).superRefine((value, ctx) => {
  if ((value.segment === "business" || value.segment === "institucional") && !value.organization) {
    ctx.addIssue({ code: "custom", path: ["organization"], message: "Ingresa el nombre de la organización." });
  }
});
