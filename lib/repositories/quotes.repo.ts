import { createHash, createHmac } from "node:crypto";
import { getPrisma } from "@/lib/db";
import type { QuoteSubmission } from "@/lib/quotes";

const WINDOW_MS = 30 * 60_000;

class QuoteQuotaExceeded extends Error {
  constructor(readonly retryAfter: number) { super("QUOTE_QUOTA"); }
}

export async function recordQuote(input: QuoteSubmission, secret: string) {
  const { requestId, segment, name, email, organization, sites, need } = input;
  const payload = { segment, name, email, organization: organization || null, sites, need };
  const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const emailKey = "email:" + createHmac("sha256", secret).update(email).digest("hex");

  try {
    return await getPrisma().$transaction(async (tx) => {
      const result = await tx.quoteRequest.createMany({
        data: [{ id: requestId, fingerprint, ...payload }], skipDuplicates: true,
      });
      if (result.count === 0) {
        const saved = await tx.quoteRequest.findUnique({ where: { id: requestId }, select: { fingerprint: true } });
        return { status: saved?.fingerprint === fingerprint ? "duplicate" : "conflict" } as const;
      }

      const now = Date.now();
      const start = new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS);
      for (const [key, limit] of [["global", 100], [emailKey, 5]] as const) {
        const rows = await tx.$queryRaw<{ count: number }[]>`
          INSERT INTO "public"."quote_rate_windows" ("key", "windowStart", "count") VALUES (${key}, ${start}, 1)
          ON CONFLICT ("key", "windowStart") DO UPDATE
          SET "count" = "quote_rate_windows"."count" + 1
          WHERE "quote_rate_windows"."count" < ${limit}
          RETURNING "count"
        `;
        if (rows.length === 0) {
          throw new QuoteQuotaExceeded(Math.max(1, Math.ceil((start.getTime() + WINDOW_MS - now) / 1000)));
        }
      }
      return { status: "created" } as const;
    });
  } catch (error) {
    if (error instanceof QuoteQuotaExceeded) return { status: "limited", retryAfter: error.retryAfter } as const;
    throw error;
  }
}
