import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAnalysis } from "@/lib/analyzer/engine";
import { safeFetch, type SafeHttpSuccess } from "@/lib/analyzer/http-safe";

vi.mock("@/lib/analyzer/http-safe", () => ({ safeFetch: vi.fn() }));
vi.mock("@/lib/analyzer/safety", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/analyzer/safety")>(),
  resolveAndGuardHost: vi.fn(async () => ({ ok: true, ips: ["93.184.216.34"] })),
}));

const input = { url: "https://example.com", frameworkIds: ["GDPR" as const] };
function fixture(patch: Partial<SafeHttpSuccess> = {}): SafeHttpSuccess {
  return {
    ok: true,
    finalUrl: new URL(input.url),
    status: 200,
    statusText: "OK",
    contentType: "text/html", validatedAddresses: 1, durationMs: 10,
    headers: new Map([["content-type", "text/html"]]),
    setCookies: [],
    body: "<html><title>Prueba ficticia</title></html>",
    bodyBytes: 42,
    truncated: false,
    redirects: [],
    ...patch,
  };
}

beforeEach(() => vi.mocked(safeFetch).mockReset());

describe("cobertura del Privacy Score", () => {
  it("excluye dimensiones dependientes de HTML cuando la lectura se truncó", async () => {
    vi.mocked(safeFetch).mockResolvedValue(fixture({ truncated: true }));
    const result = await runAnalysis(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.analysis.dimensions.filter(item => item.evaluated).map(item => item.id)).toEqual(["seguridad"]);
    expect(result.analysis.findings.some(item => item.title.includes("política de privacidad no detectado"))).toBe(false);
    expect(result.analysis.score).toBe(result.analysis.dimensions[0].value);
  });

  it("no calcula un score para una página de error", async () => {
    vi.mocked(safeFetch).mockResolvedValue(fixture({ status: 503 }));
    await expect(runAnalysis(input)).resolves.toMatchObject({ ok: false, code: "SITIO_INACCESIBLE" });
  });
});
