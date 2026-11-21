import { createHash } from "node:crypto";
import { WORKSPACE_COOKIE, WORKSPACE_TOKEN_RE } from "@/lib/workspace";
import { ApiError } from "@/lib/services/errors";

// La cookie es una credencial de sesión anónima. Solo se guarda su hash.
export function workspaceHash(req: Request): string {
  const prefix = `${WORKSPACE_COOKIE}=`;
  const token = req.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(prefix))?.slice(prefix.length) ?? "";
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
