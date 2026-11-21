import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

/* Cada prueba usa un nombre de cubo único para no compartir estado con
   otras pruebas del mismo proceso. */

function req(ip: string): Request {
  return new Request("https://privacyos.test/api/analyze", {
    headers: { "x-real-ip": ip, "x-forwarded-for": ip },
  });
}

describe("rateLimit", () => {
  it("permite hasta el límite y luego bloquea con Retry-After", () => {
    const name = `prueba-${Math.random()}`;
    const r1 = rateLimit(req("203.0.113.10"), { name, limit: 2, windowMs: 60_000 });
    const r2 = rateLimit(req("203.0.113.10"), { name, limit: 2, windowMs: 60_000 });
    const r3 = rateLimit(req("203.0.113.10"), { name, limit: 2, windowMs: 60_000 });

    expect(r1).toMatchObject({ ok: true, remaining: 1 });
    expect(r2).toMatchObject({ ok: true, remaining: 0 });
    expect(r3.ok).toBe(false);
    if (!r3.ok) {
      expect(r3.retryAfter).toBeGreaterThanOrEqual(1);
      expect(r3.remaining).toBe(0);
    }
  });

  it("aísla cubos por IP", () => {
    const name = `prueba-${Math.random()}`;
    expect(rateLimit(req("198.51.100.1"), { name, limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(req("198.51.100.2"), { name, limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(req("198.51.100.1"), { name, limit: 1, windowMs: 60_000 }).ok).toBe(false);
  });

  it("aísla cubos por nombre de operación", () => {
    const suffix = Math.random();
    const ip = "192.0.2.44";
    expect(rateLimit(req(ip), { name: `a-${suffix}`, limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(req(ip), { name: `b-${suffix}`, limit: 1, windowMs: 60_000 }).ok).toBe(true);
  });

  it("usa un cubo compartido cuando no hay IP", () => {
    const name = `prueba-${Math.random()}`;
    const sinIp = () => new Request("https://privacyos.test/api/analyze");
    expect(rateLimit(sinIp(), { name, limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(sinIp(), { name, limit: 1, windowMs: 60_000 }).ok).toBe(false);
  });
});
