import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const key = process.env.GEMINI_TEST_API_KEY?.trim();
const model = process.env.GEMINI_TEST_MODEL?.trim();
if (!key || !model) {
  console.error("Configura GEMINI_TEST_API_KEY y GEMINI_TEST_MODEL en el entorno de pruebas.");
  process.exit(2);
}
if (key === process.env.GEMINI_API_KEY || !/^[a-z0-9][a-z0-9.-]{1,100}$/i.test(model)) {
  console.error("Usa una clave independiente de pruebas y el identificador simple de un modelo.");
  process.exit(2);
}
const db = new URL(process.env.DATABASE_URL ?? "invalid:");
if (!["postgresql:", "postgres:"].includes(db.protocol) ||
    db.hostname !== "127.0.0.1" || db.pathname !== "/privacyos_evolution") {
  console.error("Se requiere la base local desechable privacyos_evolution.");
  process.exit(2);
}
assert.equal(process.env.NODE_OPTIONS?.trim() ?? "", "", "Quita NODE_OPTIONS para evitar proveedores simulados.");
const port = 3313;
const base = "http://127.0.0.1:" + port;
const headers = { "x-goog-api-key": key };
const modelInfo = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model, {
  headers, signal: AbortSignal.timeout(10_000),
});
assert(modelInfo.ok, "Gemini no reconoció el modelo o la credencial (HTTP " + modelInfo.status + ").");
console.log("Gemini reconoce el modelo de prueba.");

const { GEMINI_TEST_API_KEY: testKey, DIRECT_URL: direct, ...env } = process.env;
void testKey;
void direct;
const server = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port),
], { windowsHide: true, stdio: "inherit", env: {
  ...env, GEMINI_API_KEY: key, ASSISTANT_MODEL: model, ASSISTANT_ENABLED: "1", ASSISTANT_STRICT_MODEL: "1", QUOTES_ENABLED: "0",
} });

function session() {
  let cookie;
  return async (path, method = "GET", data) => {
    const headers = new Headers({ "content-type": "application/json" });
    if (cookie) headers.set("cookie", cookie);
    const response = await fetch(base + path, {
      method, headers, body: JSON.stringify(data), signal: AbortSignal.timeout(45_000),
    });
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
    return response;
  };
}
const a = session();
const b = session();
let reportId;
try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    if (server.exitCode !== null) break;
    const health = await fetch(base + "/api/health", { signal: AbortSignal.timeout(2_000) }).catch(() => null);
    if (health?.ok) { ready = true; break; }
    await delay(400);
  }
  assert(ready, "El entorno local de Gemini no inició.");
  const created = await a("/api/analyses", "POST", { url: "https://example.com", frameworkIds: ["GDPR"] });
  assert.equal(created.status, 201, "No se generó el informe de prueba.");
  const document = (await created.json()).analysis;
  reportId = document.id;
  const evidence = document.payload.evidence[0].id;
  const question = "¿Qué se observó en " + evidence + "? Cita ese identificador y explica una limitación.";
  const post = (send, question, history) => send("/api/assistant", "POST", { analysisId: reportId, question, history });
  assert.equal((await post(b, question)).status, 404, "Otro workspace obtuvo acceso.");
  const first = await post(a, question);
  assert.equal(first.status, 200, "La primera consulta a Gemini falló.");
  const answer = (await first.json()).answer;
  assert(answer.includes(evidence), "La respuesta no citó la evidencia solicitada.");
  const second = await post(a, "¿Qué debería revisar después? Distingue observación de hipótesis.", [
    { role: "usuario", text: question },
    { role: "asistente", text: answer.slice(0, 600) },
  ]);
  assert.equal(second.status, 200, "La pregunta de seguimiento falló.");
  const followup = (await second.json()).answer;
  assert(followup.trim(), "No hubo una respuesta de seguimiento.");
  console.log("Gemini real: informe propio, cita, seguimiento y denegación cruzada verificados.");
  console.log("Revisión cualitativa de respuestas del informe de prueba:", JSON.stringify({ answer, followup }));
} finally {
  try {
    if (reportId) await a("/api/analyses/" + reportId, "DELETE").catch(() => undefined);
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const stopped = once(server, "exit");
      server.kill();
      await stopped;
    }
  }
}
