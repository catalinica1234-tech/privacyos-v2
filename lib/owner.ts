import { createHash } from "node:crypto";
import { WORKSPACE_HEADER, WORKSPACE_TOKEN_RE } from "@/lib/workspace";
import { ApiError } from "@/lib/services/errors";

/* ═══════════════════════════════════════════════════════════════
   Derivación del identificador de espacio de trabajo.

   El middleware entrega el token en `x-privacyos-workspace`. Aquí se
   transforma en un hash SHA-256 antes de tocar la base: la base nunca
   almacena el token en claro y, si se filtra una fila, no permite
   reutilizar la cookie.

   Aislamiento real por capacidad, no autenticación: no hay cuentas,
   recuperación ni segundo factor. Se documenta como limitación.
   ═══════════════════════════════════════════════════════════════ */

export function workspaceHash(req: Request): string {
  const token = req.headers.get(WORKSPACE_HEADER)?.trim() ?? "";
  if (!WORKSPACE_TOKEN_RE.test(token)) {
    throw new ApiError(
      401,
      "SIN_ESPACIO_TRABAJO",
      "No se pudo identificar tu espacio de trabajo.",
      "Recarga la aplicación para generar uno nuevo.",
    );
  }
  return createHash("sha256").update(`privacyos-workspace:${token}`).digest("hex");
}
