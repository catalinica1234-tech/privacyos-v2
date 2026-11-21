import { describe, expect, it } from "vitest";
import { quoteSchema } from "@/lib/quotes";
import { parseJsonBodyLimited } from "@/lib/request";

const request = {
  requestId: "33a68797-9300-4f23-ad23-f4beb13f3e55",
  segment: "personal", name: " Solicitud ficticia ", email: " Test@EXAMPLE.TEST ",
  sites: "1", need: "Revisión técnica del sitio", consent: true, website: "",
};

describe("cotizaciones", () => {
  it("normaliza el correo y permite que el segmento personal omita la organización", () => {
    expect(quoteSchema.parse(request)).toMatchObject({ name: "Solicitud ficticia", email: "test@example.test" });
  });

  it("requiere organización para una institución, consentimiento y honeypot vacío", () => {
    for (const patch of [{ segment: "institucional" }, { consent: false }, { website: "bot" }]) {
      expect(quoteSchema.safeParse({ ...request, ...patch }).success).toBe(false);
    }
  });

  it("limita cuerpos transmitidos sin content-length", async () => {
    const body = new Request("http://localhost/api/quotes", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request),
    });
    await expect(parseJsonBodyLimited(body, 32)).rejects.toMatchObject({ status: 413 });
  });
});
