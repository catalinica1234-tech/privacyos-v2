"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn, scoreTone } from "@/lib/utils";

/* ═══ Primitivas del sistema de diseño Serenidad ═══ */

export function Pill({ tone = "neutral", children, className }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={cn("pill", tone, className)}>{children}</span>;
}

export function ScorePill({ score }: { score: number }) {
  return <Pill tone={scoreTone(score)}>{score}/100</Pill>;
}

export function SectionHead({ eyebrow, title, text, align = "left" }: { eyebrow?: string; title: string; text?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="font-disp text-2xl font-semibold tracking-tight sm:text-[28px] md:text-3xl">{title}</h2>
      {text ? <p className="mt-3 text-[15px] leading-7 text-muted">{text}</p> : null}
    </div>
  );
}

export function LinkBtn({ href, children, variant = "primary", size, className, external }: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "subtle";
  size?: "sm" | "lg";
  className?: string;
  external?: boolean;
}) {
  const cls = cn("btn", variant === "primary" && "btn-primary", variant === "ghost" && "btn-ghost", variant === "subtle" && "btn-subtle", size === "sm" && "btn-sm", size === "lg" && "btn-lg", className);
  return external ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}

export function Alert({ kind = "info", title, children }: { kind?: "info" | "success" | "warning" | "danger"; title?: string; children?: ReactNode }) {
  const map = {
    info: { cls: "border-[color:var(--c-line)] bg-[color:var(--c-card)] text-ink", icon: <Info className="h-4 w-4 text-[color:var(--c-bosque)]" /> },
    success: { cls: "border-[color:var(--c-menta)]/30 bg-[color:var(--c-menta-soft)]", icon: <CheckCircle2 className="h-4 w-4 text-[color:var(--c-menta)]" /> },
    warning: { cls: "border-[color:var(--c-risk-med)]/30 bg-[color:var(--c-risk-med-soft)]", icon: <AlertTriangle className="h-4 w-4 text-[color:var(--c-risk-med)]" /> },
    danger: { cls: "border-[color:var(--c-risk-crit)]/30 bg-[color:var(--c-risk-crit-soft)]", icon: <XCircle className="h-4 w-4 text-[color:var(--c-risk-crit)]" /> },
  }[kind];
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", map.cls)}>
      <span className="mt-0.5 flex-none">{map.icon}</span>
      <div className="text-[13.5px] leading-6">
        {title ? <p className="font-disp font-semibold">{title}</p> : null}
        {children ? <div className="text-muted">{children}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card card-quiet flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--c-bosque-soft)] text-[color:var(--c-bosque)]">{icon}</div>
      <h3 className="font-disp text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-[13.5px] text-muted">{text}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Meter({ value, sm }: { value: number; sm?: boolean }) {
  return (
    <span className={cn("meter block", sm && "meter-sm")}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

export function StatCard({ label, value, note, tone }: { label: string; value: ReactNode; note?: string; tone?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className={cn("mt-2 font-disp text-3xl font-semibold tracking-tight tnum", tone)}>{value}</p>
      {note ? <p className="mt-1.5 text-[11.5px] text-muted">{note}</p> : null}
    </div>
  );
}

/* Pestañas controladas */
export function Tabs({ tabs, active, onChange }: {
  tabs: Array<{ id: string; label: string; badge?: ReactNode }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-[color:var(--c-marfil)] p-1 no-print" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex flex-none items-center gap-2 rounded-full px-4 py-2 font-disp text-[13px] font-medium transition-all",
            active === t.id ? "bg-[color:var(--c-card)] text-ink shadow-soft" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  );
}

/* Modal / diálogo accesible mínimo */
export function Modal({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={title} className="card relative z-10 w-full max-w-lg p-6 animate-in">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-disp text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
