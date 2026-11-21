import { NextResponse, type NextRequest } from "next/server";
import { WORKSPACE_COOKIE, WORKSPACE_HEADER, WORKSPACE_TOKEN_RE } from "@/lib/workspace";

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function middleware(request: NextRequest): NextResponse {
  const existing = request.cookies.get(WORKSPACE_COOKIE)?.value;
  const token = existing && WORKSPACE_TOKEN_RE.test(existing) ? existing : newToken();

  if (existing !== token) request.cookies.set(WORKSPACE_COOKIE, token);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(WORKSPACE_HEADER);

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
