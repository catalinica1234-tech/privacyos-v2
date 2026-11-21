import { describe, expect, it } from "vitest";
import { MAX_JSON_BYTES, assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";
import { ApiError } from "@/lib/services/errors";

function expectApiError(fn: () => unknown, status: number, code: string) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(status);
    expect((err as ApiError).code).toBe(code);
    return;
  }
  throw new Error("Se esperaba un ApiError");
}

async function expectApiErrorAsync(fn: () => Promise<unknown>, status: number, code: string) {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(status);
    expect((err as ApiError).code).toBe(code);
    return;
  }
  throw new Error("Se esperaba un ApiError");
}

function post(body: string, headers: Record<string, string>): Request {
  return new Request("https://privacyos.test/api/analyze", { method: "POST", body, headers });
}

describe("assertSameOrigin", () => {
  it("acepta peticiones sin Origin de clientes no navegador", () => {
    expect(() => assertSameOrigin(new Request("https://privacyos.test/api/analyze", { headers: { host: "privacyos.test" } }))).not.toThrow();
  });

  it("acepta el mismo host", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://privacyos.test/api/analyze", {
          headers: { host: "privacyos.test", origin: "https://privacyos.test" },
        }),
      ),
    ).not.toThrow();
  });

  it("considera el host reenviado por el proxy", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://interno/api/analyze", {
          headers: { "x-forwarded-host": "privacyos-v2.vercel.app", origin: "https://privacyos-v2.vercel.app" },
        }),
      ),
    ).not.toThrow();
  });

  it("rechaza otro origen", () => {
    expectApiError(
      () =>
        assertSameOrigin(
          new Request("https://privacyos.test/api/analyze", {
            headers: { host: "privacyos.test", origin: "https://atacante.test" },
          }),
        ),
      403,
      "ORIGEN_NO_PERMITIDO",
    );
  });

  it("rechaza Origin: null y orígenes inválidos", () => {
    expectApiError(
      () => assertSameOrigin(new Request("https://privacyos.test/api/analyze", { headers: { host: "privacyos.test", origin: "null" } })),
      403,
      "ORIGEN_NO_PERMITIDO",
    );
    expectApiError(
      () => assertSameOrigin(new Request("https://privacyos.test/api/analyze", { headers: { host: "privacyos.test", origin: "no-es-url" } })),
      403,
      "ORIGEN_NO_PERMITIDO",
    );
  });

  it("rechaza Sec-Fetch-Site cross-site aunque el Origin coincida", () => {
    expectApiError(
      () =>
        assertSameOrigin(
          new Request("https://privacyos.test/api/analyze", {
            headers: {
              host: "privacyos.test",
              origin: "https://privacyos.test",
              "sec-fetch-site": "cross-site",
            },
          }),
        ),
      403,
      "ORIGEN_NO_PERMITIDO",
    );
  });
});

describe("parseJsonBodyLimited", () => {
  it("acepta JSON válido dentro del límite", async () => {
    await expect(parseJsonBodyLimited(post('{"url":"https://example.com"}', { "content-type": "application/json" }))).resolves.toEqual({
      url: "https://example.com",
    });
  });

  it("acepta tipos application/*+json", async () => {
    await expect(
      parseJsonBodyLimited(post("{}", { "content-type": "application/vnd.api+json; charset=utf-8" })),
    ).resolves.toEqual({});
  });

  it("rechaza tipos de contenido no JSON", async () => {
    await expectApiErrorAsync(
      () => parseJsonBodyLimited(post("url=https://example.com", { "content-type": "application/x-www-form-urlencoded" })),
      415,
      "TIPO_CONTENIDO",
    );
  });

  it("rechaza JSON inválido o vacío", async () => {
    await expectApiErrorAsync(
      () => parseJsonBodyLimited(post("{no-json", { "content-type": "application/json" })),
      400,
      "VALIDACION",
    );
    await expectApiErrorAsync(
      () => parseJsonBodyLimited(post("   ", { "content-type": "application/json" })),
      400,
      "VALIDACION",
    );
  });

  it("rechaza cuerpos que exceden el límite", async () => {
    const grande = JSON.stringify({ relleno: "x".repeat(MAX_JSON_BYTES + 10) });
    await expectApiErrorAsync(
      () => parseJsonBodyLimited(post(grande, { "content-type": "application/json" })),
      413,
      "CUERPO_DEMASIADO_GRANDE",
    );
  });
});
