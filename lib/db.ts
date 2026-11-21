import { PrismaClient } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════
   CAPA DE DATOS · cliente Prisma (singleton)
   Única dependencia del motor de datos; la usan exclusivamente
   los repositorios de lib/repositories. La conexión es perezosa:
   no se abre hasta la primera consulta (el build no la necesita).
   ═══════════════════════════════════════════════════════════════ */

const globalForPrisma = globalThis as unknown as {
  __privacyosPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__privacyosPrisma) {
    globalForPrisma.__privacyosPrisma = new PrismaClient();
  }
  return globalForPrisma.__privacyosPrisma;
}

/** true si hay una cadena de conexión configurada (no valida credenciales). */
export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

let cached: { at: number; ok: boolean } | null = null;

/**
 * Comprueba que la conexión puede leer las tablas del workspace y que existe su esquema de aislamiento.
 * El resultado se cachea 5 s para no castigar cada petición.
 */
export async function checkDatabase(timeoutMs = 2500): Promise<boolean> {
  if (!databaseConfigured()) return false;
  if (cached && Date.now() - cached.at < 5000) return cached.ok;

  const prisma = getPrisma();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });

  try {
    const ok = await Promise.race([
      prisma.$queryRaw`
        SELECT 1
        FROM "sites" AS s
        CROSS JOIN "analyses" AS a
        WHERE FALSE AND s."ownerHash" = a."ownerHash"
      `.then(() => true),
      timeout,
    ]);
    const result = ok === true;
    cached = { at: Date.now(), ok: result };
    return result;
  } catch {
    cached = { at: Date.now(), ok: false };
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
