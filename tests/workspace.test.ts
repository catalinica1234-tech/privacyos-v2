import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { workspaceHash } from "@/lib/owner";
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from "@/lib/workspace";
import { middleware } from "../middleware";

const url = "https://example.com/api/analyses";
const tokenA = "a".repeat(64);
const tokenB = "b".repeat(64);

function request(token?: string, header?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `${WORKSPACE_COOKIE}=${token}`);
  if (header) headers.set(WORKSPACE_HEADER, header);
  return new NextRequest(url, { headers });
}

describe("credencial de workspace", () => {
  it("solo usa la cookie y conserva hashes estables por credencial", () => {
    expect(workspaceHash(request(tokenA, tokenB))).toBe(workspaceHash(request(tokenA)));
    expect(workspaceHash(request(tokenB))).not.toBe(workspaceHash(request(tokenA)));
    expect(() => workspaceHash(request(undefined, tokenA))).toThrow();
  });

  it("emite una cookie segura en HTTPS y descarta la cabecera del cliente", () => {
    const response = middleware(request(undefined, tokenA));
    const cookie = response.cookies.get(WORKSPACE_COOKIE);
    expect(cookie?.value).toMatch(/^[0-9a-f]{64}$/);
    expect(cookie?.value).not.toBe(tokenA);
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(response.headers.has(`x-middleware-request-${WORKSPACE_HEADER}`)).toBe(false);
  });
});
