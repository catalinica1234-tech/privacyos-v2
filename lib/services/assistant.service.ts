import type { Analysis } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE SERVICIO · asistente explicativo del informe
   Integra un modelo de lenguaje PRE-ENTRENADO (Gemini) vía API.
   El contexto es SIEMPRE el JSON del propio análisis, recortado a
   lo esencial; el modelo no recibe cookies crudos ni cabeceras completas.
   Guardas anti-invención (aplicadas en el system prompt, verificable
   en el informe técnico):
   1) Responder SOLO con base en las observaciones del informe.
   2) Distinguir hechos observados (accommodation/evidence) de interpretación.
   3) Declarar explícitamente si el informe no contiene la información.
   4) NUNCA declarar incumplimiento legal ni dar asesoría jurídica.
   La clave nunca sale del servidor (GEMINI_API_KEY solo en env).
   ═══════════════════════════════════════════════════════════════ */

const MODELOS_PREFERIDOS: string[] = (process.env.ASSISTANT_MODEL
  ? [process.env.ASSISTANT_MODEL, "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"]
  : ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"]
).filter((m, i, arr) => arr.indexOf(m) === i);
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/** Disponible sólo si hay clave y el flag explícito lo permite. */
export function asistenteDisponible(): boolean {
  return process.env.ASSISTANT_ENABLED === "1" && Boolean(process.env.GEMINI_API_KEY);
}

/** Recorte del informe: solo lo que el modelo necesita (privacidad y tokens). */
export function construirContexto(a: Analysis) {
  return {
    sitio: a.input.host,
    url: a.input.url,
    fecha: a.createdAt,
    score: a.score,
    riesgoTotal: a.riskLevel ?? "sin clasificación",
    dimensiones: a.dimensions.map((d) => ({ nombre: d.label, valor: d.evaluated ? d.value : null, nota: d.note })),
    hallazgos: a.findings.map((f) => ({
      id: f.id,
      titulo: f.title,
      severidad: f.severity,
      estado: f.status,
      explicacion: f.explanation,
      impacto: f.businessImpact,
      recomendacion: f.recommendation,
      limitacion: f.limitation ?? null,
    })),
    evidencias: a.evidence.map((e) => ({
      id: e.id,
      tipo: e.kind,
      titulo: e.title,
      detalle: e.detail.slice(0, 300),
    })),
    limitacionesTesteadas: a.engineNotes,
  };
}

const SYSTEM = `Eres el asistente explicativo de PRIVACYOS, un producto que analiza la privacidad de sitios web y produce informes con hallazgos y evidencias observadas por un motor automatizado.

Tu única fuente de verdad es el JSON del informe que se entrega en el mensaje del usuario ("INFORME"). Reglas inquebrantables:

1. Responde SOLO a partir del contenido del informe. Si el informe no contiene la información necesaria para responder, dilo explícitamente y sugiere qué parte del informe revisar. No uses conocimiento externo sobre el sitio evaluado ni inventes datos, cifras o cookies.
2. Distingue siempre entre hechos observados (evidencias registradas por el motor) e interpretaciones. Usa frases como "el motor observó..." para los hechos.
3. Nunca declares que el sitio incumple una ley. La relación con marcos normativos en el informe es INDICATIVA: el cumplimiento legal lo determina una asesora jurídica.
4. No eres una asesoría legal: sirve para explicar en palabras sencillas. Si preguntan por acciones legales, redirige a la sección "Centro de derechos de privacidad" del producto y a asesoría profesional.
5. Escribe en español chileno claro y cercano, como si se lo explicaras a un familiar en un minuto. Nada de jerga: si usas un término técnico (cookie, TLS, rastreador), explícalo inmediatamente en palabras simples. Sin emojis.
6. CORTO SIEMPRE: máximo 3 frases cortas, o una lista de hasta 3 puntos con frases de una línea. Empieza directo con la respuesta ("El hallazgo dice que…"), sin "Claro", "Por supuesto" ni introducciones.
7. Si el usuario pregunta por un hallazgo concreto (por ejemplo H-2), enfócate solo en ese hallazgo y sus evidencias.
8. Termina con UNA acción concreta y pequeña que la persona puede hacer (ejemplo: "Primero revisa que el sitio tenga HTTPS en todas las páginas").`;

export async function explicar(pregunta: string, informe: Analysis): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("FALTA_KEY");

  const contexto = construirContexto(informe);
  // Recordatorio de brevedad en el turno del usuario (los modelos lo cumplen
  // mejor al final del contexto que solo en el system prompt).
  const preguntaAcotada = `${pregunta}\n\n(Responde en español simple, máximo 60 palabras.)`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: `INFORME (JSON):\n${JSON.stringify(contexto)}\n\nPREGUNTA DEL USUARIO:\n${preguntaAcotada}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 350,
    },
  };

  // Fallback en cadena: si un modelo está saturado, retirado o muy lento,
  // prueba el siguiente (timeout por modelo 30 s; total ≤ 60 s del serverless).
  let ultimoError: Error | null = null;
  for (const model of MODELOS_PREFERIDOS) {
    try {
      const texto = await pedirProvedor(model, body, key);
      return texto;
    } catch (err) {
      ultimoError = err as Error;
      if (!(ultimoError as ProveedorError).reintentable) throw ultimoError;
    }
  }
  throw ultimoError ?? new Error("SIN_RESPUESTA");
}

type ProveedorError = Error & { reintentable?: boolean };

async function pedirProvedor(
  model: string,
  body: Record<string, unknown>,
  key: string,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT(model), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const e = err as Error & { name?: string };
    // Timeout / abort → el siguiente modelo podría estar disponible.
    const timeoutErr = new Error(`GEMINI_TIMEOUT_${model}`) as ProveedorError;
    timeoutErr.reintentable = e.name === "TimeoutError" || e.name === "AbortError";
    throw timeoutErr;
  }

  if (!res.ok) {
    const err = new Error(`GEMINI_${res.status}`) as ProveedorError;
    // 429/503 (cuota/demanda) y 404 (modelo retirado) → probar con el siguiente modelo.
    err.reintentable = res.status === 429 || res.status === 503 || res.status === 404;
    throw err;
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const texto = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!texto) throw new Error("RESPUESTA_VACIA");
  return texto;
}

export const DISCLAIMER = "Explicación asistida por IA basada en el informe. No es asesoría legal y no declara incumplimientos.";
