import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const url = new URL(process.env.DATABASE_URL ?? "invalid:");
const port = 3311;
const base = "http://127.0.0.1:" + port;
const reportTarget = "https://example.com";

if (!["postgresql:", "postgres:"].includes(url.protocol) ||
    url.hostname !== "127.0.0.1" || !["/privacyos_integration", "/privacyos_evolution"].includes(url.pathname)) {
  throw new Error("Esta prueba requiere exclusivamente una base local desechable de integración o evolución.");
}

const env = {
  ...process.env,
  ASSISTANT_ENABLED: "1",
  GEMINI_API_KEY: "test-only",
};
delete env.DIRECT_URL;

function createSession() {
  let cookie;
  return async function request(path, method = "GET", data, extraHeaders = {}) {
    const headers = new Headers({ "content-type": "application/json", ...extraHeaders });
    if (cookie) headers.set("cookie", cookie);
    const response = await fetch(base + path, {
      method,
      headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(45_000),
    });
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
    return response;
  };
}

async function start() {
  const server = spawn(process.execPath, [
    "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port),
  ], { env, stdio: "inherit", windowsHide: true });

  try {
    for (let attempt = 0; attempt < 30; attempt++) {
      if (server.exitCode !== null) throw new Error("Next.js stopped before health was ready.");
      const response = await fetch(base + "/api/health", { signal: AbortSignal.timeout(3_000) })
        .catch(() => null);
      if (response?.ok && server.exitCode === null) return server;
      await delay(500);
    }
    throw new Error("Health could not verify the runtime connection.");
  } catch (error) {
    await stop(server);
    throw error;
  }
}

async function stop(server) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  const stopped = once(server, "exit");
  server.kill();
  await stopped;
}

const a = createSession();
const b = createSession();
const serverBefore = await start();
let server = serverBefore;
let sitePath;
let analysisPath;
try {
  const site = await a("/api/sites", "POST", { url: "https://workspace-restart.example", nombre: "Prueba ficticia" });
  assert.equal(site.status, 201);
  const siteId = (await site.json()).site.id;
  sitePath = "/api/sites/" + siteId;
  const created = await a("/api/analyses", "POST", { url: reportTarget, frameworkIds: ["GDPR"], siteId });
  assert.equal(created.status, 201);
  const analysisId = (await created.json()).analysis.id;
  analysisPath = "/api/analyses/" + analysisId;

  assert.equal((await b(sitePath)).status, 404);
  assert.equal((await b(sitePath, "PATCH", { nombre: "Otro workspace" })).status, 404);
  assert.equal((await b(sitePath, "DELETE")).status, 404);
  assert.equal((await b(analysisPath)).status, 404);
  assert.equal((await b(analysisPath, "PATCH", { revisado: true })).status, 404);
  assert.equal((await b(analysisPath, "DELETE")).status, 404);
  assert.equal((await b("/api/analyses", "POST", { url: reportTarget, frameworkIds: ["GDPR"], siteId })).status, 400);
  assert.equal((await b("/api/assistant", "POST", { analysisId, question: "Explica el informe" })).status, 404);
  const listB = await (await b("/api/analyses")).json();
  assert.equal(listB.analyses.some((row) => row.id === analysisId), false);
  assert.equal((await b("/api/analyses", "DELETE", undefined, { "x-confirm-delete": "workspace" })).status, 200);

  await stop(server);
  server = await start();
  assert.equal((await a(sitePath)).status, 200);
  const detail = await a(analysisPath);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).analysis.siteId, siteId);
  const listA = await (await a("/api/analyses?siteId=" + siteId)).json();
  assert(listA.analyses.some((row) => row.id === analysisId));
  console.log("OK: aislamiento A/B, Gemini denegado, purga acotada y persistencia tras reinicio.");
} finally {
  try {
    if (analysisPath) assert.equal((await a(analysisPath, "DELETE")).status, 204);
    if (sitePath) assert.equal((await a(sitePath, "DELETE")).status, 204);
  } finally {
    await stop(server);
  }
}
