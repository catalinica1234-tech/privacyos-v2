/* ═══════════════════════════════════════════════════════════════
   CAPA DE SERVICIO · errores de dominio
   Los servicios lanzan ApiError; los controladores solo los traducen.
   ═══════════════════════════════════════════════════════════════ */

export class ApiError extends Error {
  status: number;
  code: string;
  hint?: string;

  constructor(status: number, code: string, message: string, hint?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.hint = hint;
  }
}
