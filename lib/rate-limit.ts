import { createHash } from "node:crypto";

/* ═══════════════════════════════════════════════════════════════
   Límite de peticiones en memoria (best-effort por instancia).

   En Vercel cada instancia serverless tiene su propia memoria, por lo
   que este límite NO es un control distribuido: frena ráfagas contra
   una misma instancia y abuso trivial, pero no sustituye a un servicio
   compartido (Upstash Redis / Vercel KV) para producción multi-instancia.
   Se documenta como limitación en SECURITY.md.

   La IP nunca se almacena en claro: la clave es un hash SHA-256.
   ═══════════════════════════════════════════════════════════════ */

export interface RateLimitOptions {
  /** Nombre lógico del cubo (ruta + operación). */
  name: string;
  limit: number;
  windowMs: number;
}

export type RateLimitResult =
  | { ok: true; limit: number; remaining: number; resetAt: number }
  | { ok: false; limit: number; remaining: 0; resetAt: number; retryAfter: number };

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "sin-ip";
}

function keyFor(req: Request, name: string): string {
  return createHash("sha256").update(`${name}:${clientIp(req)}`).digest("hex").slice(0, 32);
}

function prune(now: number): void {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Si aún está lleno, se vacía para acotar memoria (se reinicia la ventana).
  if (buckets.size >= MAX_KEYS) buckets.clear();
}

export function rateLimit(req: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  prune(now);
  const key = keyFor(req, options.name);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit: options.limit, remaining: Math.max(0, options.limit - 1), resetAt };
  }

  existing.count += 1;
  if (existing.count > options.limit) {
    return {
      ok: false,
      limit: options.limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  };
}
