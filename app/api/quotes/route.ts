import { NextResponse } from "next/server";
import { jsonError, routeError } from "@/lib/http";
import { quoteSchema } from "@/lib/quotes";
import { recordQuote } from "@/lib/repositories/quotes.repo";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rateSecret = process.env.QUOTES_RATE_SECRET;
  if (process.env.QUOTES_ENABLED !== "1" || !rateSecret || rateSecret.trim().length < 32) {
    return jsonError(503, "COTIZACIONES_PAUSADAS", "La recepción de solicitudes está temporalmente deshabilitada.");
  }
  try {
    assertSameOrigin(req);
    const parsed = quoteSchema.safeParse(await parseJsonBodyLimited(req, 8_192));
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        message: "Revisa los campos antes de enviar.",
        fields: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const result = await recordQuote(parsed.data, rateSecret);
    if (result.status === "conflict") {
      return jsonError(409, "SOLICITUD_DISTINTA", "El identificador ya corresponde a otra solicitud.");
    }
    if (result.status === "limited") {
      return jsonError(429, "DEMASIADAS_SOLICITUDES", "Se alcanzó el límite temporal de solicitudes.",
        "Inténtalo más tarde.", { "Retry-After": String(result.retryAfter) });
    }
    return NextResponse.json({ ok: true }, { status: result.status === "created" ? 201 : 200 });
  } catch (error) {
    return routeError(error);
  }
}
