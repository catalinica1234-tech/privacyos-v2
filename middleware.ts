import { NextResponse, type NextRequest } from "next/server";
import { WORKSPACE_COOKIE, WORKSPACE_HEADER, WORKSPACE_TOKEN_RE } from "@/lib/workspace";

/* ═══════════════════════════════════════════════════════════════
   Espacio de trabajo anónimo (capability token).

   No es autenticación de identidad: es un token aleatorio de 256 bits
   que vive en una cookie HttpOnly. El servidor lo usa para derivar un
   hash y aislar sitios/análisis por navegador. Sin la cookie no se
   puede leer ni modificar el espacio de trabajo.

   El token se propaga a las Route Handlers por una cabecera interna
   que este middleware SIEMPRE sobrescribe, para que un cliente no
   pueda inyectar el espacio de trabajo de otra persona.
   ═══════════════════════════════════════════════════════════════ */

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function middleware(request: NextRequest): NextResponse {
  const existing = request.cookies.get(WORKSPACE_COOKIE)?.value;
  const token = existing && WORKSPACE_TOKEN_RE.test(existing) ? existing : newToken();

  const requestHeaders = new Headers(request.headers);
  // Se elimina cualquier valor enviado por el cliente y se fija el token
  // resuelto por el servidor.
  requestHeaders.delete(WORKSPACE_HEADER);
  requestHeaders.set(WORKSPACE_HEADER, token);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (existing !== token) {
    response.cookies.set({
      name: WORKSPACE_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
