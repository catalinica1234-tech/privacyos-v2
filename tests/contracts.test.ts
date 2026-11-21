import { describe, expect, it } from "vitest";
import { Analysis, analysisCreateSchema, analyzeResponse } from "@/lib/contracts";
import { workspaceHash } from "@/lib/owner";
import { sampleAnalysis } from "@/lib/sample";
import { ApiError } from "@/lib/services/errors";

describe("contratos de análisis", () => {
  it("el informe de muestra cumple el contrato completo", () => {
    const parsed = Analysis.safeParse(sampleAnalysis);
    expect(parsed.success).toBe(true);
  });

  it("rechaza un score fuera de rango", () => {
    expect(Analysis.safeParse({ ...sampleAnalysis, score: 101 }).success).toBe(false);
    expect(Analysis.safeParse({ ...sampleAnalysis, score: -1 }).success).toBe(false);
  });

  it("rechaza hallazgos sin evidencia asociada", () => {
    const finding = { ...sampleAnalysis.findings[0], evidenceIds: [] };
    const parsed = Analysis.safeParse({ ...sampleAnalysis, findings: [finding] });
    expect(parsed.success).toBe(false);
  });

  it("valida la entrada de creación y marcos permitidos", () => {
    expect(analysisCreateSchema.safeParse({ url: "https://example.com", frameworkIds: ["GDPR"] }).success).toBe(true);
    expect(analysisCreateSchema.safeParse({ url: "https://example.com", frameworkIds: [] }).success).toBe(false);
    expect(analysisCreateSchema.safeParse({ url: "https://example.com", frameworkIds: ["OTRO"] }).success).toBe(false);
    expect(analysisCreateSchema.safeParse({ url: "no-es-url", frameworkIds: ["GDPR"] }).success).toBe(false);
  });

  it("el contrato de respuesta distingue éxito y error", () => {
    expect(analyzeResponse.safeParse({ ok: true, analysis: sampleAnalysis }).success).toBe(true);
    expect(
      analyzeResponse.safeParse({
        ok: false,
        code: "URL_INVALIDA",
        message: "La URL no es válida.",
        hint: "Revisa el formato.",
      }).success,
    ).toBe(true);
  });
});

describe("workspaceHash", () => {
  const token = "a".repeat(64);

  function request(tokenValue?: string): Request {
    const headers: Record<string, string> = {};
    if (tokenValue) headers["x-privacyos-workspace"] = tokenValue;
    return new Request("https://privacyos.test/api/analyses", { headers });
  }

  it("deriva un hash estable y distinto por token", () => {
    const h1 = workspaceHash(request(token));
    const h2 = workspaceHash(request(token));
    const h3 = workspaceHash(request("b".repeat(64)));
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it("rechaza tokens ausentes o malformados", () => {
    for (const value of [undefined, "", "abc", "A".repeat(64), "g".repeat(64)]) {
      try {
        workspaceHash(request(value));
        throw new Error("Se esperaba ApiError");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(401);
        expect((err as ApiError).code).toBe("SIN_ESPACIO_TRABAJO");
      }
    }
  });
});
