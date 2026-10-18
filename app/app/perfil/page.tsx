"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Database, ShieldCheck, UserRound } from "lucide-react";
import { getHistory } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Alert, LinkBtn, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   Perfil (Hito 1): datos guardados solo en este navegador.
   Sin cuentas ni servidores de autenticación en esta fase académica.
   ═════════════════════════════════════════════════════════════════ */

const PROFILE_KEY = "privacyos.profile.v1";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      const p = raw ? ({ ...emptyProfile, ...JSON.parse(raw) } as LocalProfile) : emptyProfile;
      setProfile(p);
      setNombre(p.nombre);
      setOrganizacion(p.organizacion);
      setRol(p.rol);
      const hist = getHistory();
      setStats({
        total: hist.length,
        primero: hist.length > 0 ? hist[hist.length - 1].createdAt : null,
        ultimo: hist.length > 0 ? hist[0].createdAt : null,
      });
    } finally {
      setReady(true);
    }
  }, []);

  const save = () => {
    const next: LocalProfile = { nombre: nombre.trim(), organizacion: organizacion.trim(), rol: rol.trim() };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
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
          Esta información se guarda únicamente en este navegador y se usa para contextualizar tus informes. En la fase
          2 (con backend) migrará a una cuenta real con acceso restringido.
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
              <input id="pf-name" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Nombre y apellido" disabled={!ready} />
            </div>
            <div>
              <label htmlFor="pf-org" className="label">Organización</label>
              <input id="pf-org" value={organizacion} onChange={(e) => setOrganizacion(e.target.value)} className="input" placeholder="Nombre de la empresa o equipo" disabled={!ready} />
            </div>
            <div>
              <label htmlFor="pf-rol" className="label">Rol</label>
              <input id="pf-rol" value={rol} onChange={(e) => setRol(e.target.value)} className="input" placeholder="p. ej., DPO, desarrollador, gerencia" disabled={!ready} />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={save} className="btn btn-primary btn-sm">Guardar perfil</button>
            {saved ? <Pill tone="pill-low">Guardado en este navegador</Pill> : null}
          </div>
        </section>

        <section className="grid content-start gap-4">
          <div className="card p-5">
            <p className="eyebrow">Actividad local</p>
            <div className="mt-4 grid gap-3 text-[13px]">
              <p className="flex items-center justify-between"><span className="text-muted">Análisis guardados</span><strong className="tnum">{stats.total}</strong></p>
              <p className="flex items-center justify-between"><span className="text-muted">Primer análisis</span><strong>{stats.primero ? formatDate(stats.primero) : "—"}</strong></p>
              <p className="flex items-center justify-between"><span className="text-muted">Último análisis</span><strong>{stats.ultimo ? formatDate(stats.ultimo) : "—"}</strong></p>
            </div>
          </div>

          <div className="card card-quiet p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold"><Database className="h-4 w-4 text-bosque" />Persistencia local</p>
            <p className="mt-2 text-[12.5px] leading-5 text-muted">
              Perfil e historial viven en localStorage del navegador. No hay cuentas, contraseñas ni servidores que
              guarden esta información en la fase académica actual.
            </p>
          </div>

          <Alert kind="info" title="Autenticación real (fase 2)">
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-bosque" />
              La plataforma está preparada para incorporar cuentas y persistencia servidor en la fase 2, sin cambiar la
              interfaz actual.
            </p>
          </Alert>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LinkBtn href="/app/configuracion" variant="ghost" size="sm">Ir a ajustes</LinkBtn>
        <span className={cn("inline-flex items-center gap-1.5 text-[12px] text-muted")}><CalendarDays className="h-3.5 w-3.5" />Hito 1 · motor local con historial del navegador</span>
      </div>
    </div>
  );
}
