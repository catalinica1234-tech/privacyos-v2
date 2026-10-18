"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, LayoutDashboard, Radar, Scale, Settings, SunMoon, HandHeart, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/theme";
import { cn } from "@/lib/utils";

/* ═════════════════════════════════════════════════════════════════
   Shell de la APLICACIÓN (independiente de la landing).
   Navegación lateral en escritorio · barra inferior en móvil.
   ═════════════════════════════════════════════════════════════════ */

const NAV = [
  { href: "/app/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/app/nuevo", label: "Nuevo análisis", icon: Radar },
  { href: "/app/historial", label: "Historial", icon: Archive },
  { href: "/app/regulatorio", label: "Normativa", icon: Scale },
  { href: "/app/derechos", label: "Derechos", icon: HandHeart },
  { href: "/app/configuracion", label: "Ajustes", icon: Settings },
] as const;

const MOBILE_NAV = NAV.filter((n) => n.href !== "/app/configuracion");

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { resolvedDark, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Sidebar (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-line-soft bg-[color:var(--c-card)] md:block no-print">
        <div className="flex h-full flex-col p-4">
          <Link href="/" className="mb-7 flex items-center gap-2.5 px-2" aria-label="Volver a la landing">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-bosque font-disp text-[13px] font-bold text-[#fff] dark:text-[#10231b]">P</span>
            <span className="font-disp text-[16px] font-semibold tracking-tight">PRIVACYOS</span>
          </Link>
          <nav className="grid gap-1" aria-label="Navegación de la aplicación">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                    active
                      ? "bg-[color:var(--c-bosque-soft)] text-bosque"
                      : "text-muted hover:bg-[color:var(--c-marfil)] hover:text-ink",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto grid gap-2 px-2">
            <Link href="/app/perfil" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted hover:bg-[color:var(--c-marfil)] hover:text-ink">
              <UserRound className="h-4 w-4" /> Perfil
            </Link>
            <button
              onClick={() => setTheme(resolvedDark ? "light" : "dark")}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-muted hover:bg-[color:var(--c-marfil)] hover:text-ink"
            >
              <SunMoon className="h-4 w-4" /> Modo {resolvedDark ? "claro" : "oscuro"}
            </button>
            <p className="mt-2 rounded-xl bg-[color:var(--c-marfil)] p-3 text-[10.5px] leading-4 text-muted">
              Motor v1.0.0 · observación de página inicial · sin dictamen legal
            </p>
          </div>
        </div>
      </aside>

      {/* Barra superior (móvil y escritorio) */}
      <header className="sticky top-0 z-30 border-b border-line-soft bg-[color:var(--c-canvas)]/90 backdrop-blur md:pl-60 no-print">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2 md:hidden" aria-label="PRIVACYOS">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-bosque font-disp text-[11px] font-bold text-white dark:text-[#10231b]">P</span>
            <span className="font-disp text-[15px] font-semibold">PRIVACYOS</span>
          </Link>
          <p className="hidden font-disp text-[14px] font-medium text-muted md:block">Plataforma de inteligencia de privacidad digital</p>
          <div className="flex items-center gap-2">
            <Link href="/app/nuevo" className="btn btn-primary btn-sm">
              <Radar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nuevo análisis</span>
              <span className="sm:hidden">Analizar</span>
            </Link>
            <button onClick={() => setTheme(resolvedDark ? "light" : "dark")} className="btn btn-ghost btn-sm" aria-label="Cambiar tema">
              <SunMoon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 md:pb-10 md:pl-[17.5rem] md:pr-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Bottom nav (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-[color:var(--c-card)]/95 backdrop-blur md:hidden no-print" aria-label="Navegación móvil">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium",
                  active ? "text-bosque" : "text-muted",
                )}
              >
                <n.icon className="h-5 w-5" />
                {n.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
