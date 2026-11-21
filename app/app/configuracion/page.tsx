"use client";

import { useState } from "react";
import { Check, Contrast, Database, Monitor, Moon, PlayCircle, Settings2, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { useTheme } from "@/components/theme";
import { borrarEspacioRemoto } from "@/lib/api-client";
import { Alert, LinkBtn, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   Configuración: tema, contraste, datos y estado del motor.
   El historial se persiste en el servidor dentro de un espacio de
   trabajo anónimo mediante una cookie HttpOnly.
   ═════════════════════════════════════════════════════════════════ */

type Aviso = { tono: "ok" | "warn" | "error"; texto: string } | null;

export default function ConfiguracionPage() {
  const { prefs, setTheme, setContrast } = useTheme();
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const wipe = async () => {
    setBorrando(true);
    setAviso(null);
    const servidor = await borrarEspacioRemoto();
    setBorrando(false);
    setConfirmarBorrado(false);

    if (servidor === "ok") {
      setAviso({
        tono: "ok",
        texto: "Se borraron los sitios y análisis de este espacio de trabajo. La operación no se puede deshacer.",
      });
    } else if (servidor === "no-disponible") {
      setAviso({
        tono: "warn",
        texto: "El servidor no respondió y no se pudo confirmar el borrado; vuelve a intentarlo cuando el servicio de datos esté disponible.",
      });
    } else {
      setAviso({
        tono: "error",
        texto: "El servidor rechazó o no completó el borrado. Vuelve a intentarlo desde este mismo navegador.",
      });
    }
  };

  const themeOptions = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Monitor },
  ] as const;

  const contrastOptions = [
    { id: "normal", label: "Contraste normal" },
    { id: "alto", label: "Alto contraste" },
  ] as const;

  return (
    <div className="grid gap-6 max-w-3xl">
      <header>
        <p className="eyebrow">Ajustes</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Preferencias y datos</h1>
        <p className="mt-2 text-[13.5px] leading-6 text-muted">
          Ajusta cómo se ve la aplicación y administra los datos de tu espacio de trabajo.
        </p>
      </header>

      {/* Tema y contraste */}
      <section className="card p-6">
        <p className="flex items-center gap-2 font-disp text-[15.5px] font-semibold"><Contrast className="h-4 w-4 text-bosque" aria-hidden="true" />Modo de visualización</p>
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
              <o.icon className="h-4 w-4" aria-hidden="true" />{o.label}
              {prefs.theme === o.id ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
        <p className="hint mt-3">El modo «Sistema» sigue la preferencia de tu dispositivo y se aplica sin parpadeo al cargar.</p>

        <p className="mt-6 text-[13px] font-medium">Contraste de la interfaz</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {contrastOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => setContrast(o.id)}
              aria-pressed={prefs.contrast === o.id}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px] font-medium transition-all",
                prefs.contrast === o.id
                  ? "border-[color:var(--c-bosque)] bg-[color:var(--c-bosque-soft)] text-bosque"
                  : "border-line text-muted hover:border-[color:var(--c-muted)]",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="hint mt-2">El alto contraste refuerza bordes, texto y foco para personas con baja visión o sensibilidad al contraste.</p>
      </section>

      {/* Datos */}
      <section className="card p-6">
        <p className="flex items-center gap-2 font-disp text-[15.5px] font-semibold"><Database className="h-4 w-4 text-bosque" aria-hidden="true" />Datos de tu espacio de trabajo</p>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          Los análisis se guardan en un espacio de trabajo anónimo asociado a una cookie HttpOnly de este navegador. Si borras las cookies o usas otro equipo, no podrás
          recuperar ese espacio: no hay cuentas ni inicio de sesión en esta versión.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <LinkBtn href="/app/informe/PS-SAMPLE" variant="ghost" size="sm"><PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />Ver informe de muestra</LinkBtn>
          <button onClick={() => setConfirmarBorrado(true)} className="btn btn-danger btn-sm">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Borrar sitios y análisis
          </button>
        </div>

        {aviso ? (
          <div className="mt-4" role={aviso.tono === "error" ? "alert" : "status"}>
            <Alert kind={aviso.tono === "ok" ? "success" : aviso.tono === "warn" ? "warning" : "danger"}>
              {aviso.texto}
            </Alert>
          </div>
        ) : null}
      </section>

      {/* Motor */}
      <section className="card p-6">
        <p className="flex items-center gap-2 font-disp text-[15.5px] font-semibold"><Settings2 className="h-4 w-4 text-bosque" aria-hidden="true" />Motor de análisis</p>
        <div className="mt-4 grid gap-2 text-[13px]">
          <p className="flex justify-between gap-4"><span className="text-muted">Versión</span><span className="code">PRIVACYOS 1.0.0-sereno</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Alcance</span><span className="text-right">Página inicial · sin crawling</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Datos inventados</span><span className="text-right font-medium text-bosque">Ninguno en modo real</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Seguridad del motor</span><span className="text-right">Validaciones SSRF + redirecciones revalidadas</span></p>
          <p className="flex justify-between gap-4"><span className="text-muted">Asistente IA</span><span className="text-right">Gemini solo en el servidor</span></p>
        </div>
      </section>

      <Alert kind="info" title="Idioma y límites de esta versión">
        La interfaz está en español (producto orientado a Chile y LatAm). Los marcos regulatorios disponibles son la Ley
        19.628, la Ley 21.719 (preparatoria hasta 01-DIC-2026) y el RGPD; otras normas se añadirán en fases posteriores.
      </Alert>

      <p className="flex items-start gap-2 text-[12px] leading-5 text-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-bosque" aria-hidden="true" />
        El perfil personal de esta visita permanece en memoria.
      </p>

      <Modal open={confirmarBorrado} onClose={() => !borrando && setConfirmarBorrado(false)} title="¿Borrar todos los datos?">
        <p className="text-[13.5px] leading-6 text-muted">
          Se eliminarán <strong className="text-ink">todos los sitios y análisis de este espacio de trabajo</strong>, incluidos sus hallazgos y evidencias. El perfil local y las preferencias se
          conservan. Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button onClick={() => setConfirmarBorrado(false)} disabled={borrando} className="btn btn-ghost btn-sm">Cancelar</button>
          <button onClick={wipe} disabled={borrando} className="btn btn-danger btn-sm">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {borrando ? "Borrando…" : "Sí, borrar todo"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
