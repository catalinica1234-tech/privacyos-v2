const BASE = "http://localhost:3000/api/analyze";

async function post(body) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  // 1 · SSRF: loopback
  const t1 = await post({ url: "http://localhost:3000", frameworkIds: ["CL-1928"] });
  console.log("SSRF loopback →", t1.status, t1.json.ok === false ? `${t1.json.code}: ${t1.json.message}` : JSON.stringify(t1.json).slice(0, 200));

  // 2 · IP privada literal
  const t2 = await post({ url: "http://192.168.1.10/admin", frameworkIds: ["CL-1928"] });
  console.log("IP privada →", t2.status, t2.json.ok === false ? `${t2.json.code}: ${t2.json.message}` : "PERMITIDO (¡mal!)");

  // 3 · Protocolo no permitido
  const t3 = await post({ url: "ftp://ejemplo.cl", frameworkIds: ["CL-1928"] });
  console.log("Protocolo ftp →", t3.status, t3.json.ok === false ? `${t3.json.code}: ${t3.json.message}` : "PERMITIDO (¡mal!)");

  // 4 · Puerto no estándar
  const t4 = await post({ url: "http://ejemplo.cl:8080", frameworkIds: ["CL-1928"] });
  console.log("Puerto 8080 →", t4.status, t4.json.ok === false ? `${t4.json.code}: ${t4.json.message}` : "PERMITIDO (¡mal!)");

  // 5 · Sitio real
  const t5 = await post({ url: "https://www.chile.gob.cl", frameworkIds: ["CL-1928", "CL-21719", "GDPR"] });
  if (t5.json.ok) {
    const a = t5.json.analysis;
    console.log("\n=== ANÁLISIS REAL:", a.id, `score=${a.score}`, `riesgo=${a.riskLevel}`, "===");
    console.log("ACCESS:", JSON.stringify(a.accessibility));
    console.log("\nDIMS:", a.dimensions.map((d) => `${d.id}=${d.evaluated ? d.value : "n/e"}(w${d.weight})`).join(" "));
    console.log("\nHALLAZGOS:");
    for (const f of a.findings) console.log(`  ${f.id} [${f.status}/${f.severity}/${f.priority}] ${f.title}`);
    console.log("\nEVIDENCIAS:");
    for (const e of a.evidence) console.log(`  ${e.id} [${e.kind}] ${e.title}`);
    console.log("\nPLAN:");
    for (const r of a.recommendations) console.log(`  ${r.id} [${r.urgencia}] ${r.title}`);
    console.log("\nNOTAS:", a.engineNotes.join(" | "));
  } else {
    console.log("Sitio real →", t5.status, `${t5.json.code}: ${t5.json.message}`);
  }
}

main().catch((e) => {
  console.error("FALLO:", e.message);
  process.exit(1);
});
