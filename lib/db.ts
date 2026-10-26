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
