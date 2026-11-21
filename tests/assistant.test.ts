import { afterEach, describe, expect, it, vi } from "vitest";
import { explicar } from "@/lib/services/assistant.service";
import { assistantRequestSchema } from "@/lib/contracts";
import { sampleAnalysis } from "@/lib/sample";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("asistente explicativo", () => {
  it("acepta preguntas generales o un identificador acotado y descarta el informe del cliente", () => {
    expect(assistantRequestSchema.parse({ question: "¿Qué es una cookie?", analysis: {} }))
      .toEqual({ question: "¿Qué es una cookie?" });
    expect(assistantRequestSchema.safeParse({ question: "x".repeat(601) }).success).toBe(false);
    expect(assistantRequestSchema.safeParse({ question: "Explica esto", analysisId: "PS-invalid-id" }).success)
      .toBe(false);
  });

  it("envía contexto nulo para preguntas generales", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    const fetchProvider = vi.fn<typeof fetch>(async () => Response.json({
      candidates: [{ content: { parts: [{ text: "Una cookie guarda una preferencia." }] } }],
    }));
    vi.stubGlobal("fetch", fetchProvider);
    await expect(explicar("¿Qué es una cookie?")).resolves.toContain("preferencia");
    const body = JSON.parse(String(fetchProvider.mock.calls[0][1]?.body));
    expect(body.contents[0].parts[0].text).toContain("\nnull\n");
  });

  it("rechaza una respuesta vacía o de tipo incorrecto", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      candidates: [{ content: { parts: [{ text: 42 }] } }],
    })));
    await expect(explicar("¿Qué observó el motor?", sampleAnalysis)).rejects.toThrow("RESPUESTA_INVALIDA");
  });
});
