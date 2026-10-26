"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircleQuestion, Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import type { Analysis } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════════
   Asistente explicativo del informe (Fase IA · Hito 2)
   - El usuario pregunta en lenguaje natural sobre SU informe.
   - La llamada al modelo ocurre SOLO en el servidor (/api/assistant);
     la clave GEMINI_API_KEY jamás llega al navegador.
   - Accesibilidad: dictado por voz en el navegador (Web Speech API)
     para quien prefiere hablar antes que escribir; ocurre en el
     dispositivo y si el navegador no lo soporta, el botón no aparece.
   Diseño: usa las clases existentes (card, btn, pill, tag) para no
   alterar la identidad Serenidad.
   ═══════════════════════════════════════════════════════════════ */

/* Tipos mínimos de la Web Speech API (no están en lib.dom) */
interface ReconocedorEvento {
  results: { [i: number]: { 0: { transcript: string }; isFinal: boolean; length: number } };
}
interface Reconocedor {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ReconocedorEvento) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
function crearReconocedor(): Reconocedor | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => Reconocedor;
    webkitSpeechRecognition?: new () => Reconocedor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

const SUGERIDAS = [
  "¿Qué significa este resultado?",
  "¿Por qué debería importarme?",
  "¿Qué debería solucionar primero?",
  "Explícamelo en palabras sencillas",
];

type RespFx =
  | { tipo: "vacío" }
  | { tipo: "cargando"; pregunta: string }
  | { tipo: "respuesta"; texto: string }
  | { tipo: "error"; mensaje: string };

export function AsistenteIA({ analysis, className }: { analysis: Analysis; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [efecto, setEfecto] = useState<RespFx>({ tipo: "vacío" });
  const [lista, setLista] = useState<Array<{ quien: "usuario" | "asistente"; texto: string }>>([]);
  const [escuchando, setEscuchando] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(false);
  const recRef = useRef<Reconocedor | null>(null);

  useEffect(() => {
    setSoportaVoz(Boolean(crearReconocedor()));
    return () => { recRef.current?.stop(); };
  }, []);

  function alternarDictado() {
    if (escuchando) {
      recRef.current?.stop();
      setEscuchando(false);
      return;
    }
    const rec = crearReconocedor();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = "es-CL";
    rec.continuous = false;
    rec.interimResults = false;
    let textoFinal = "";
    rec.onresult = (e) => {
      for (let i = 0; e.results[i]; i++) {
        if (e.results[i].isFinal) textoFinal += e.results[i][0].transcript;
      }
      setPregunta(textoFinal.trim());
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => {
      setEscuchando(false);
      // Al terminar el dictado se envía automáticamente lo reconocido.
      const t = textoFinal.trim();
      if (t.length >= 3) void enviar(t);
    };
    try { rec.start(); setEscuchando(true); } catch { setEscuchando(false); }
  }

  async function enviar(p: string) {
    const pLimpia = p.trim();
    if (pLimpia.length < 3 || efecto.tipo === "cargando") return;
    setPregunta("");
    setLista((prev) => [...prev, { quien: "usuario", texto: pLimpia }]);
    setEfecto({ tipo: "cargando", pregunta: pLimpia });

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: pLimpia, analysis }),
      });
      const data = (await res.json()) as { ok: boolean; answer?: string; message?: string; hint?: string };
      if (data.ok && data.answer) {
        setLista((prev) => [...prev, { quien: "asistente", texto: data.answer! }]);
        setEfecto({ tipo: "vacío" });
      } else {
        setEfecto({ tipo: "error", mensaje: data.message ?? "No se pudo responder ahora." });
      }
    } catch {
      setEfecto({ tipo: "error", mensaje: "Sin conexión con el asistente. El informe completo sigue disponible en las demás pestañas." });
    }
  }

  return (
    <section id="asistente-ia" className={className}>
      {abierto ? (
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-bosque" />
            <p className="eyebrow">Asistente explicativo</p>
            <button onClick={() => { setAbierto(false); setLista([]); setEfecto({ tipo: "vacío" }); }} aria-label="Cerrar asistente" className="ml-auto rounded-lg p-1.5 hover:bg-[color:var(--c-menta-soft)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-5 text-muted">
            Pregunta en palabras propias sobre este informe de{" "}
            <strong className="text-ink">{analysis.input.host}</strong>. Responde solo con lo observado en el
            análisis, en corto y en simple; si algo no está en el informe, lo dirá. También puedes usar el botón
            de micro para hacer la pregunta hablando.
          </p>

          {lista.length === 0 && efecto.tipo === "vacío" ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGERIDAS.map((s) => (
                <button key={s} onClick={() => enviar(s)} className={cnChip}>
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {lista.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {lista.map((m, i) => (
                <div key={i} className={m.quien === "usuario" ? cnBubbleUser : cnBubbleAsistente}>
                  {m.texto}
                </div>
              ))}
            </div>
          ) : null}

          {efecto.tipo === "cargando" ? (
            <div className="mt-4 flex items-center gap-2 text-[13px] text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-bosque" /> Generando explicación…
            </div>
          ) : null}
          {efecto.tipo === "error" ? (
            <p className="mt-4 rounded-xl bg-[color:var(--c-risk-med-soft)] p-3 text-[12.5px] leading-5 text-[color:var(--c-risk-med)]">
              {efecto.mensaje}
            </p>
          ) : null}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(pregunta);
            }}
          >
            <input
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Escribe tu pregunta… (máx. 600 caracteres)"
              maxLength={600}
              className="input flex-1"
            />
            {soportaVoz ? (
              <button
                type="button"
                onClick={alternarDictado}
                aria-label={escuchando ? "Detener dictado" : "Dictar pregunta por voz"}
                title={escuchando ? "Detener dictado" : "Dictar por voz (te recomiendo el micrófono del equipo)"}
                className={`btn btn-sm flex-none self-center ${escuchando ? "btn-danger" : "btn-ghost"}`}
              >
                {escuchando ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {escuchando ? "Escuchando…" : "Hablar"}
              </button>
            ) : null}
            <button type="submit" disabled={efecto.tipo === "cargando"} className="btn btn-primary btn-sm flex-none self-center">
              <Send className="h-3.5 w-3.5" /> Preguntar
            </button>
          </form>
          <p className="mt-3 rounded-xl bg-[color:var(--c-marfil)] p-3 text-[11px] leading-4 text-muted">
            Explicación asistida por IA basada en el informe. <strong>No es asesoría legal</strong> y no declara
            incumplimientos: la conversación ocurre en tu navegador y el servidor; la clave del proveedor
            nunca sale del servidor.
          </p>
        </div>
      ) : (
        <button onClick={() => setAbierto(true)} className="btn btn-ghost btn-sm w-full justify-center">
          <MessageCircleQuestion className="h-3.5 w-3.5" />
          Abre el asistente explicativo: el informe en palabras sencillas
        </button>
      )}
    </section>
  );
}

/* clases locales reutilizadas; cn para las uniones condicionales */
const cnChip =
  "cursor-pointer rounded-full border border-line bg-[color:var(--c-menta-soft)] px-3 py-1.5 text-[12px] font-medium text-bosque hover:opacity-80 transition-opacity";
const cnBubbleUser =
  "justify-self-end max-w-[92%] rounded-2xl rounded-br-sm bg-[color:var(--c-bosque-soft)] px-4 py-2.5 text-[13px] leading-5 text-ink";
const cnBubbleAsistente =
  "justify-self-start max-w-[95%] rounded-2xl rounded-bl-sm bg-[color:var(--c-code-bg)] px-4 py-2.5 text-[13px] leading-6 text-ink";

export default AsistenteIA;
