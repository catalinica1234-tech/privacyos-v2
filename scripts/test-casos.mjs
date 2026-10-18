const BASE = "http://localhost:3000/api/analyze";

async function post(body) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function run(label, body) {
  const json = await post(body);
  if (!json.ok) {
    console.log(`[${label}] ERROR: ${json.code}: ${json.message}`);
    return;
  }
  const a = json.analysis;
  console.log(`\n[${label}] ${a.id} score=${a.score} riesgo=${a.riskLevel} final=${a.accessibility.finalUrl} redirects=${a.accessibility.redirects.length}`);
  console.log("  Dims:", a.dimensions.map((d) => `${d.id}=${d.evaluated ? d.value : "n/e"}`).join(" "));
  for (const f of a.findings) console.log(`  ${f.id} [${f.status}/${f.severity}/${f.priority}] ${f.title}`);
  for (const r of a.recommendations) console.log(`  PLAN ${r.id} [${r.urgencia}] ${r.title}`);
}

async function main() {
  await run("example.com", { url: "https://example.com", frameworkIds: ["GDPR"] });
  await run("redirect http→https", { url: "http://gob.cl", frameworkIds: ["CL-1928"] });
}
main().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
