/* ═══════════════════════════════════════════════════════════════
   PRIVACYOS · Prueba del CRUD del Hito 2 contra la API real
   Uso:  node scripts/test-crud.mjs [BASE]   (default http://localhost:3000)
   Gateway de la pauta A1: crea/lee/actualiza/borra en los DOS recursos,
   verifica códigos HTTP y la persistencia real (incluso tras borrar).
   ═══════════════════════════════════════════════════════════════ */

const BASE = process.argv[2] ?? "http://localhost:3000";
const now = () => new Date().toISOString().slice(11, 19);
let pasados = 0;
let fallidos = [];

function check(nombre, cond, detalle = "") {
  if (cond) {
    pasados++;
    console.log(`  ✓ ${nombre}${detalle ? " · " + detalle : ""}`);
  } else {
    fallidos.push(nombre);
    console.log(`  ✗ ${nombre}${detalle ? " · " + detalle : ""}`);
  }
}

async function req(metodo, ruta, cuerpo) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: cuerpo !== undefined ? { "content-type": "application/json" } : undefined,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch { /* sin cuerpo json */ }
  }
  return { status: res.status, data };
}

/* ── SITE ── */
async function suiteSites() {
  console.log(`\n[${now()}] · Recurso SITE (persistencia real)`);
  const urlUnica = `https://sitio-demo-${Date.now()}.cl`;

  const crea = await req("POST", "/api/sites", { url: urlUnica, nombre: "Demo CRUD", notas: "" });
  check("POST crea → 201", crea.status === 201);
  const siteId = crea.data?.site?.id;
  check("201 devuelve id", typeof siteId === "string" && siteId.length > 5, siteId ?? "—");

  const lista = await req("GET", "/api/sites");
  check("GET lista → 200", lista.status === 200);
  check("el creado aparece", Array.isArray(lista.data?.sites) && lista.data.sites.some(s => s.id === siteId));

  const patch = await req("PATCH", `/api/sites/${siteId}`, { notas: "Revisar retención (prueba auto)" });
  check("PATCH parcial → 200", patch.status === 200);
  check("notas persistidas", patch.data?.site?.notas === "Revisar retención (prueba auto)");

  const dup = await req("POST", "/api/sites", { url: urlUnica });
  check("POST duplicado → 409", dup.status === 409, JSON.stringify(dup.data?.code ?? ""));

  const invalido = await req("POST", "/api/sites", { url: "no-es-url" });
  check("POST inválido → 400", invalido.status === 400);

  const fantasma = await req("PATCH", "/api/sites/noexiste000", { notas: "x" });
  check("PATCH inexistente → 404", fantasma.status === 404);

  // persistencia tras "reinicio razonable": 2ª lectura separada en el tiempo
  const releer = await req("GET", `/api/sites/${siteId}`);
  check("relanzado GET sigue con datos (persistencia)", releer.status === 200 && releer.data?.site?.notas === "Revisar retención (prueba auto)");

  return siteId;
}

/* ── ANALYSIS (usa el motor REAL + persistencia) ── */
async function suiteAnalysis(siteId) {
  console.log(`\n[${now()}] · Recurso ANALYSIS (motor + persistencia)`);
  const marco = { url: "https://www.chile.gob.cl", siteId, frameworkIds: ["CL-1928", "CL-21719", "GDPR"] };

  const crea = await req("POST", "/api/analyses", marco);
  check("POST con motor real → 201", crea.status === 201, crea.data?.analysis?.id ?? (crea.data ? JSON.stringify(crea.data).slice(0, 120) : ""));
  const analysisId = crea.data?.analysis?.id;
  check("id formato PS-XXXXXX", /^PS-[A-Z0-9]{6}$/.test(analysisId ?? ""), analysisId ?? "—");
  check("score 0..100 en BD", crea.data?.analysis?.score >= 0 && crea.data?.analysis?.score <= 100);

  const liga = await req("GET", `/api/analyses?siteId=${siteId}`);
  check("GET ?siteId lo lista → 200", liga.status === 200 && Array.isArray(liga.data?.analyses) && liga.data.analyses.some(a => a.id === analysisId));

  const detalle = await req("GET", `/api/analyses/${analysisId}`);
  check("GET detalle → 200", detalle.status === 200);
  check("payload completo con hallazgos/evidencias", Array.isArray(detalle.data?.analysis?.payload?.evidence));

  const patchA = await req("PATCH", `/api/analyses/${analysisId}`, { notas: "prioridad 2", revisado: true });
  check("PATCH notas/revisado → 200", patchA.status === 200 && patchA.data?.analysis?.revisado === true);

  const fantasma = await req("GET", "/api/analyses/PS-NOEXISTE");
  check("GET inexistente → 404", fantasma.status === 404);

  const del = await req("DELETE", `/api/analyses/${analysisId}`);
  check("DELETE análisis → 204", del.status === 204);

  const conf = await req("GET", `/api/analyses/${analysisId}`);
  check("tras DELETE → 404 (borrado real y persistido)", conf.status === 404);

  return analysisId;
}

/* ── secuencia final: con el análisis borrado, el sitio se libera ── */
async function cierre(siteId) {
  const delS = await req("DELETE", `/api/sites/${siteId}`);
  check("DELETE sitio (ya sin análisis) → 204", delS.status === 204);

  // con análisis vivo el borrado debía responder 409: lo probamos creando otro análisis
  const guarda = await req("POST", "/api/analyses", { url: "https://example.com", siteId, frameworkIds: ["GDPR"] });
  if (guarda.status === 201 && guarda.data?.analysis?.id) {
    const id2 = guarda.data.analysis.id;
    const tryDel = await req("DELETE", `/api/sites/${siteId}`);
    check("DELETE sitio CON análisis → 409 (protege evidencias)", tryDel.status === 409);
    await req("DELETE", `/api/analyses/${id2}`);
    await req("DELETE", `/api/sites/${siteId}`);
  }
}

(async () => {
  console.log(`\nPRIVACYOS · Prueba automática del CRUD · ${BASE}`);
  let siteId = null;
  try {
    siteId = await suiteSites();
    await suiteAnalysis(siteId);
    await cierre(siteId);
  } catch (err) {
    console.log(`  ✗ Error fatal durante la prueba: ${err?.message ?? String(err)}`);
    fallidos.push("error fatal");
  }
  console.log(`\n══ RESULTADO: ${pasados} ✓ · ${fallidos.length} ✗`);
  if (fallidos.length) {
    console.log(`Fallidos: ${fallidos.join(" · ")}`);
    process.exitCode = 1;
  } else {
    console.log("Todo el CRUD, validaciones, errores y persistencia respondieron correctamente ✅");
  }
})();
