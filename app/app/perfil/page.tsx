"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Database, ShieldCheck, UserRound } from "lucide-react";
import { listarRemotos } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { Alert, LinkBtn, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

interface LocalProfile {
  nombre: string;
  organizacion: string;
  rol: string;
}

const emptyProfile: LocalProfile = { nombre: "", organizacion: "", rol: "" };

export default function PerfilPage() {
  const [profile, setProfile] = useState<LocalProfile>(emptyProfile);
  const [nombre, setNombre] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [rol, setRol] = useState("");
  const [stats, setStats] = useState<{ total: number; primero: string | null; ultimo: string | null }>({ total: 0, primero: null, ultimo: null });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    listarRemotos().then((rows) => {
      if (!active || !rows) return;
      setStats({ total: rows.length, primero: rows.at(-1)?.createdAt ?? null, ultimo: rows[0]?.createdAt ?? null });
    });
    return () => { active = false; };
  }, []);

  const save = () => {
    const next: LocalProfile = { nombre: nombre.trim(), organizacion: organizacion.trim(), rol: rol.trim() };
    setProfile(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Perfil</p>
        <h1 className="mt-1 font-disp text-2xl font-semibold tracking-tight">Tu espacio de trabajo</h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-muted">
          Estos datos se mantienen en memoria mientras la página está abierta. Los análisis usan un espacio anónimo ligado a este navegador;
          esta versión todavía no tiene cuentas ni acceso desde otros dispositivos.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--c-bosque-soft)] text-bosque">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="font-disp text-[16px] font-semibold">{profile.nombre || "Sin nombre registrado"}</p>
              <p className="text-[12px] text-muted">{profile.organizacion || "Sin organización registrada"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label htmlFor="pf-name" className="label">Nombre</label>
              <input id="pf-name" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Nombre y apellido" />
            </div>
            <div>
              <label htmlFor="pf-org" className="label">Organización</label>
              <input id="pf-org" value={organizacion} onChange={(e) => setOrganizacion(e.target.value)} className="input" placeholder="Nombre de la empresa o equipo" />
            </div>
            <div>
              <label htmlFor="pf-rol" className="label">Rol</label>
              <input id="pf-rol" value={rol} onChange={(e) => setRol(e.target.value)} className="input" placeholder="p. ej., DPO, desarrollador, gerencia" />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={save} className="btn btn-primary btn-sm">Guardar perfil</button>
            {saved ? <Pill tone="pill-low">Actualizado para esta visita</Pill> : null}
            <span className="sr-only" role="status" aria-live="polite">{saved ? "Perfil actualizado para esta visita." : ""}</span>
          </div>
        </section>

        <section className="grid content-start gap-4">
          <div className="card p-5">
            <p className="eyebrow">Actividad del espacio de trabajo</p>
            <div className="mt-4 grid gap-3 text-[13px]">
              <p className="flex items-center justify-between"><span className="text-muted">Análisis guardados</span><strong className="tnum">{stats.total}</strong></p>
              <p className="flex items-center justify-between"><span className="text-muted">Primer análisis</span><strong>{stats.primero ? formatDate(stats.primero) : "—"}</strong></p>
              <p className="flex items-center justify-between"><span className="text-muted">Último análisis</span><strong>{stats.ultimo ? formatDate(stats.ultimo) : "—"}</strong></p>
            </div>
          </div>

          <div className="card card-quiet p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold"><Database className="h-4 w-4 text-bosque" aria-hidden="true" />Perfil local, análisis en servidor</p>
            <p className="mt-2 text-[12.5px] leading-5 text-muted">
              Tu perfil de esta visita no se adjunta a los análisis del servidor.
            </p>
          </div>

          <Alert kind="info" title="Cuentas y acceso entre dispositivos">
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-bosque" aria-hidden="true" />
              El espacio de trabajo es anónimo y se pierde si borras la cookie del navegador. La recuperación entre
              dispositivos requiere cuentas reales, previstas para una fase posterior.
            </p>
          </Alert>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LinkBtn href="/app/configuracion" variant="ghost" size="sm">Ir a ajustes</LinkBtn>
        <span className={cn("inline-flex items-center gap-1.5 text-[12px] text-muted")}><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Motor real con persistencia en servidor</span>
      </div>
    </div>
  );
}
