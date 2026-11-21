import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { enforceRateLimit, jsonError, routeError } from "@/lib/http";
import { quoteSchema } from "@/lib/quotes";
import { assertSameOrigin, parseJsonBodyLimited } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.QUOTES_ENABLED !== "1") {
    return jsonError(503, "COTIZACIONES_PAUSADAS", "La recepción de solicitudes está temporalmente deshabilitada.");
  }
  try {
    assertSameOrigin(req);
    const limited = enforceRateLimit(req, { name: "quotes", limit: 5, windowMs: 30 * 60_000 });
    if (limited) return limited;
    const parsed = quoteSchema.safeParse(await parseJsonBodyLimited(req, 8_192));
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        message: "Revisa los campos antes de enviar.",
        fields: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { requestId, segment, name, email, organization, sites, need } = parsed.data;
    const payload = { segment, name, email, organization: organization || null, sites, need };
    const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const quotes = getPrisma().quoteRequest;
    const result = await quotes.createMany({
      data: [{ id: requestId, fingerprint, ...payload }],
      skipDuplicates: true,
    });
    if (result.count === 1) return NextResponse.json({ ok: true }, { status: 201 });

    const saved = await quotes.findUnique({ where: { id: requestId }, select: { fingerprint: true } });
    if (saved?.fingerprint !== fingerprint) {
      return jsonError(409, "SOLICITUD_DISTINTA", "El identificador ya corresponde a otra solicitud.");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
