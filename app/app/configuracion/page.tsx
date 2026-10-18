"use client";

import { useEffect, useState } from "react";
import { Check, Contrast, Database, Monitor, Moon, PlayCircle, Settings2, Sun, Trash2 } from "lucide-react";
import { useTheme } from "@/components/theme";
import { clearHistory, getHistory, saveAnalysis } from "@/lib/store";
import { sampleAnalysis } from "@/lib/sample";
import { Alert } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   Configuración: tema, datos locales y estado del motor.
   ═════════════════════════════════════════════════════════════════ */

export default function ConfiguracionPage() {
  const { prefs, setTheme } = useTheme();
  const [history, setHistory] = useState<{ total: number; hasSample: boolean }>({ total: 0, hasSample: false });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const h = getHistory();
    setHistory({ total: h.length, hasSample: h.some((a) => a.id === sampleAnalysis.id) });
  }, []);

  const say = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2200);
  };

  const loadSampleIntoHistory = () => {
    saveAnalysis({ ...sampleAnalysis, createdAt: new Date().toISOString() });
    const h = getHistory();
    setHistory({ total: h.length, hasSample: h.some((a) => a.id === sampleAnalysis.id) });
    say("Muestra ilustrativa cargada en el historial.");
  };

  const wipe = () => {
    clearHistory();
    setHistory({ total: 0, hasSample: false });
    say("Historial vaciado.");
  };

  const themeOptions = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Monitor },
  ] as const;

  return (
    <div className="grid gap-6 max-w-3xl">
      <header>
        <p className="eyebrow">Ajustes</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Preferencias y datos locales</h1>
      </header>

      {/* Tema */}
      <section className="card p-6">
        <p className="flex items-center gap-2 font-disp text-[15.5px] font-semibold"><Contrast className="h-4 w-4 text-bosque" />Modo de visualización</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3">
          {themeOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              aria-pressed={prefs.theme === o.id}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-medium transition-all",
                prefs.theme === o.id
                  ? "border-[color:var(--c-bosque)] bg-[color:var(--c-bosque-soft)] text-bosque"
                  : "border-line text-muted hover:border-[color:var(--c-muted)]",
              )}
            >
              <o.icon className="h-4 w-4" />{o.label}
              {prefs.theme === o.id ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ))}
        </div>
        <p className="hint mt-3">El modo «Sistema» sigue la preferencia de tu dispositivo y la aplica sin parpadeo al cargar.</p>
      </section>

      {/* Datos locales */}
      <section className="card p-6">
        <p className="flex items-center gap-2 font-disp text-[15.5px] font-semibold"><Database className="h-4 w-4 text-bosque" />Datos guardados en este navegador</p>
        <p className="mt-2 text-[13px] text-muted">
          {history.total} análisis en el historial local (localStorage). No existen servidores ni base de datos en esta
          fase; vaciar los datos del navegador elimina el historial.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {history.hasSample ? (
            <button disabled className="btn btn-ghost btn-sm opacity-50"><PlayCircle className="h-3.5 w-3.5" />Muestra ya cargada</button>
          ) : (
            <button onClick={loadSampleIntoHistory} className="btn btn-ghost btn-sm"><PlayCircle className="h-3.5 w-3.5" />Cargar informe de muestra</button>
          )}
          <button onClick={wipe} disabled={history.total === 0} className="btn btn-danger btn-sm"><Trash2 className="h-3.5 w-3.5" />Vaciar historial</button>
          {feedback ? <span className="self-center text-[12.5px] font-medium text-bosque">{feedback}</span> : null}
        </div>
      </section>

      {/* Motor */}
      <section className="card p-6">
        <p className="flex items-center gap-2 font-disp text-[15.5px] font-semibold"><Settings2 className="h-4 w-4 text-bosque" />Motor de análisis</p>
        <div className="mt-4 grid gap-2 text-[13px]">
          <p className="flex justify-between gap-4"><span className="text-muted">Versión</span><span className="code">PRIVACYOS 1.0.0-sereno</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Alcance</span><span className="text-right">Página inicial · sin crawling</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Datos inventados</span><span className="text-right font-medium text-bosque">Ninguno en modo real</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Seguridad del motor</span><span className="text-right">Validaciones SSRF + redirecciones revalidadas</span></p>
        </div>
      </section>

      <Alert kind="info" title="Idioma y límites de esta versión">
        La interfaz está en español (producto orientado a Chile y LatAm). Los marcos regulatorios disponibles son la Ley
        19.628, la Ley 21.719 (preparatoria hasta 01-DIC-2026) y el RGPD; otras normas se añadirán en fases posteriores.
      </Alert>
    </div>
  );
}
