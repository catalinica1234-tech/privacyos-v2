import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const [first, second] = [3314, 3315].map(port => "http://127.0.0.1:" + port + "/api/quotes");
const payload = {
  requestId: randomUUID(), segment: "business", name: "Prueba ficticia",
  email: randomUUID() + "@example.test", organization: "Organización ficticia",
  sites: "2-5", need: "Comprobar el límite compartido en el laboratorio local.", consent: true, website: "",
};
const send = (target, data, headers = {}) => fetch(target, {
  method: "POST", headers: { "content-type": "application/json", ...headers },
  signal: AbortSignal.timeout(15_000), body: JSON.stringify(data),
});
const fresh = () => ({ ...payload, requestId: randomUUID() });

const retries = await Promise.all([send(first, payload), send(second, payload)]);
assert.deepEqual(retries.map(response => response.status).sort(), [200, 201], "reintentos simultáneos");
const different = await send(first, { ...payload, need: "Contenido distinto para el mismo identificador." });
assert.equal(different.status, 409);
const attempts = await Promise.all(Array.from({ length: 6 }, (_, index) => send(index % 2 === 0 ? first : second, fresh())));
assert.deepEqual(attempts.map(response => response.status).sort(), [201, 201, 201, 201, 429, 429], "cuota compartida");
assert(attempts.filter(response => response.status === 429).every(response => Number(response.headers.get("retry-after")) > 0));
assert.equal((await send(second, payload)).status, 200, "el reintento no consume cuota");
assert.equal((await send(first, { ...fresh(), website: "bot" })).status, 400);
assert.equal((await send(first, { ...fresh(), consent: false })).status, 400);
assert.equal((await send(second, fresh(), { origin: "https://other.example" })).status, 403);
console.log("Cotizaciones: idempotencia concurrente, cuota compartida, confirmación, validación y antispam OK.");
