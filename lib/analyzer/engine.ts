import type {
  AccessibilityInfo,
  Analysis,
  Dimension,
  Evidence,
  Finding,
  FrameworkId,
  FrameworkRef,
  Recommendation,
} from "@/lib/contracts";
import { FRAMEWORKS } from "@/lib/frameworks";
import { resolveAndGuardHost, validateTargetUrl } from "./safety";

/* ═════════════════════════════════════════════════════════════════
   Motor de análisis (Hito 1 — observación directa sin crawling).
   Se inspecciona ÚNICAMENTE la respuesta inicial del destino:
   cabeceras HTTP, cookies de la primera respuesta, HTML limitado
   y robots.txt. Todo hallazgo se construye a partir de evidencia
   real y declara sus limitaciones. No se generan datos inventados.
   ═════════════════════════════════════════════════════════════════ */

export const ENGINE_VERSION = "1.0.0-sereno";

const USER_AGENT =
  "PRIVACYOS-Scanner/1.0 (+https://github.com/; analisis de privacidad con fines de revision)";

const timeoutMs = () => Number(process.env.ANALYZE_TIMEOUT_MS ?? 8000);
const maxBodyBytes = () => Number(process.env.ANALYZE_MAX_BODY_BYTES ?? 512000);
const maxRedirects = () => Number(process.env.ANALYZE_MAX_REDIRECTS ?? 3);

const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
] as const;

interface EngineResultBase {
  ok: true;
  analysis: Analysis;
}
interface EngineError {
  ok: false;
  code:
    | "URL_INVALIDA"
    | "PROTOCOLO_NO_PERMITIDO"
    | "DESTINO_NO_SEGURO"
    | "SITIO_INACCESIBLE"
    | "DESCONECTADO"
    | "ERROR_INTERNO";
  message: string;
  hint: string;
}
export type EngineResult = EngineResultBase | EngineError;

/* ── Utilidades ── */

async function readLimited(res: Response, cap: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  if (!res.body) return { text: "", bytes: 0, truncated: false };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  let truncated = false;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total >= cap) {
      const remaining = Math.max(0, cap - (total - chunk.value.byteLength));
      if (remaining > 0) text += decoder.decode(chunk.value.slice(0, remaining));
      truncated = true;
      break;
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  try {
    await reader.cancel();
  } catch {
    /* cierre anticipado */
  }
  text += decoder.decode();
  return { text, bytes: total, truncated };
}

interface TrackerHit {
  name: string;
  count: number;
}

const TRACKERS: Array<{ name: string; test: string }> = [
  { name: "Google Analytics (gtag)", test: "gtag(" },
  { name: "Google Tag Manager", test: "googletagmanager.com" },
  { name: "Google Ads / DoubleClick", test: "doubleclick.net" },
  { name: "Meta Pixel", test: "connect.facebook.net" },
  { name: "Microsoft Clarity", test: "clarity.ms" },
  { name: "Hotjar", test: "hotjar.com" },
  { name: "TikTok Pixel", test: "analytics.tiktok.com" },
  { name: "HubSpot", test: "hs-scripts.com" },
];

function detectTrackers(html: string): TrackerHit[] {
  const lower = html.toLowerCase();
  const out: TrackerHit[] = [];
  for (const t of TRACKERS) {
    const count = lower.split(t.test).length - 1;
    if (count > 0) out.push({ name: t.name, count });
  }
  return out;
}

function frameworkRefsFor(ids: FrameworkId[], key: string): FrameworkRef[] {
  const relationBase: Record<FrameworkId, string> = {
    "CL-1928": "Relación indicativa con la Ley 19.628 (vigente)",
    "CL-21719": "Relación preparatoria con la Ley 21.719 (vigencia 01-DIC-2026)",
    GDPR: "Relación indicativa con el RGPD",
  };
  return ids.map((id) => ({
    id,
    ref: requirementRefFor(id, key),
    relation: relationBase[id],
  }));
}

function requirementRefFor(id: FrameworkId, key: string): string {
  const meta = FRAMEWORKS[id];
  if (!meta) return "";
  const req =
    meta.requirements.find((r) =>
      key === "seguridad"
        ? /seguridad/.test(r.id)
        : key === "terceros"
          ? /info|licitud/.test(r.id)
          : /info/.test(r.id),
    ) ?? meta.requirements[0];
  return req.ref;
}

/* ── Motor ── */

export async function runAnalysis(input: {
  id?: string;
  url: string;
  frameworkIds: FrameworkId[];
}): Promise<EngineResult> {
  const evidence: Evidence[] = [];
  const findings: Finding[] = [];
  const engineNotes: string[] = [];
  let evN = 0;

  const pushEvidence = (kind: Evidence["kind"], title: string, detail: string, source: string) => {
    evN += 1;
    const id = `EV-${String(evN).padStart(3, "0")}`;
    evidence.push({ id, kind, title, detail, source, observedAt: new Date().toISOString() });
    return id;
  };

  let fN = 0;
  const pushFinding = (f: Omit<Finding, "id">) => {
    fN += 1;
    findings.push({ ...f, id: `F-${String(fN).padStart(2, "0")}` });
  };

  /* 1 · Validación sintáctica y de seguridad de la URL */
  const safety = validateTargetUrl(input.url);
  if (!safety.ok) {
    return {
      ok: false,
      code: safety.code,
      message: safety.reason,
      hint: safety.code === "PROTOCOLO_NO_PERMITIDO" ? "Usa una dirección que comience por https://" : "Revisa la dirección e inténtalo nuevamente.",
    };
  }
  let current = safety.url;
  const redirects: string[] = [];

  /* 2 · Resolución DNS con verificación SSRF */
  const dnsGuard = await resolveAndGuardHost(current.hostname);
  if (!dnsGuard.ok) {
    return { ok: false, code: dnsGuard.code, message: dnsGuard.reason, hint: "Verifica que el sitio exista y sea público." };
  }
  pushEvidence(
    "dns",
    "Resolución DNS validada",
    `El dominio resolvió a ${dnsGuard.ips.length} dirección(es) IP pública(s). Verificación anti-SSRF: aprobada.`,
    "Proceso interno del motor (el detalle de IPs se omitió por privacidad)",
  );

  /* 3 · Solicitud HTTP con redirecciones validadas */
  const timeout = timeoutMs();
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeout);
  const started = Date.now();

  let res: Response | null = null;
  const hopTime = Math.max(3000, Math.round(timeout / 2));
  try {
    for (let hop = 0; hop <= maxRedirects(); hop++) {
      const hopController = new AbortController();
      const hopTimer = setTimeout(() => hopController.abort(), hop === 0 ? timeout : hopTime);
      try {
        const r = await fetch(current.toString(), {
          method: "GET",
          redirect: "manual",
          signal: hopController.signal,
          headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
        });
        if (r.status >= 300 && r.status < 400) {
          const loc = r.headers.get("location");
          if (loc) {
            const next = new URL(loc, current);
            const guard = validateTargetUrl(next.toString());
            if (!guard.ok) {
              return {
                ok: false,
                code: "DESTINO_NO_SEGURO",
                message: `Redirección hacia un destino no permitido: ${guard.reason}`,
                hint: "El análisis se detuvo por seguridad; no se siguió la redireción.",
              };
            }
            current = guard.url;
            if (!redirects.includes(current.host)) redirects.push(current.host);
            continue;
          }
          res = r;
          break;
        } else {
          res = r;
          break;
        }
      } finally {
        clearTimeout(hopTimer);
      }
    }
  } catch (err) {
    const aborted = err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
    return {
      ok: false,
      code: aborted ? "DESCONECTADO" : "SITIO_INACCESIBLE",
      message: aborted
        ? "El destino no respondió dentro del tiempo límite."
        : "No se pudo conectar con el sitio (inaccesible o rechazó la conexión).",
      hint: aborted
        ? "El servidor tardó demasiado en responder; inténtalo nuevamente más tarde."
        : "Verifica la dirección, o contacta al administrador del sitio si es propio.",
    };
  }
  clearTimeout(abortTimer);

  if (!res) {
    return { ok: false, code: "ERROR_INTERNO", message: "No se obtuvo respuesta del destino.", hint: "Inténtalo nuevamente." };
  }

  const headersSnapshot: Record<string, string> = {};
  for (const h of SECURITY_HEADERS) {
    const v = res.headers.get(h);
    if (v) headersSnapshot[h] = v.slice(0, 240);
  }
  const setCookieList =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];

  /* 4 · Lectura limitada del HTML inicial */
  const body = await readLimited(res, maxBodyBytes());
  const hl = body.text.toLowerCase();

  const trackers = detectTrackers(hl);
  const scriptHosts = new Set<string>();
  const srcRe = /src=["'](https?:\/\/[^\/'"\s]+)[^'"]*["']/g;
  let m: RegExpExecArray | null;
  while ((m = srcRe.exec(hl)) !== null) {
    const host = m[1].toLowerCase();
    scriptHosts.add(host);
  }

  const privacyRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{0,80})/gi;
  let privacyLink: { href: string; text: string } | null = null;
  while ((m = privacyRe.exec(hl)) !== null) {
    const href = m[1];
    const text = (m[2] || "").trim();
    const combo = `${href} ${text}`;
    if (/privacidad|privacy|pol[ií]tica|policy|datos personales/i.test(combo)) {
      privacyLink = { href: new URL(href, current).toString(), text: text || href };
      break;
    }
  }

  const titleTag = /<title>([^<]{1,160})</i.exec(hl)?.[1]?.trim() ?? null;
  const metaDesc = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,200})["']/i.exec(hl)?.[1] ?? null;
  const langAttr = /<html[^>]+lang=["']([^"']+)["']/i.exec(hl)?.[1] ?? null;

  /* 5 · robots.txt */
  let robotsStatus: number | null = null;
  let robotsSitemaps = 0;
  try {
    const robotsRes = await fetch(new URL("/robots.txt", current.origin).toString(), {
      signal: AbortSignal.timeout(Math.max(2500, Math.round(timeout / 3))),
      headers: { "user-agent": USER_AGENT },
    });
    robotsStatus = robotsRes.status;
    if (robotsRes.ok) {
      const robotsText = (await robotsRes.text()).slice(0, 20000).toLowerCase();
      robotsSitemaps = (robotsText.match(/^sitemap:/gm) ?? []).length;
    }
  } catch {
    robotsStatus = null;
  }

  const durationMs = Date.now() - started;
  const httpResponseId = pushEvidence(
    "http",
    `Respuesta HTTP ${res.status}`,
    `Solicitud GET completada en ${durationMs} ms. ${redirects.length > 0 ? `Redirecciones seguidas (validadas): ${redirects.length}.` : "Sin redirecciones usadas."}`,
    current.toString(),
  );

  const headersList = SECURITY_HEADERS.filter((h) => res?.headers.get(h));
  const missingHeaders = SECURITY_HEADERS.filter((h) => !res?.headers.get(h));
  pushEvidence(
    "header",
    "Cabeceras de seguridad observadas",
    `Presentes: ${headersList.length > 0 ? headersList.join(", ") : "ninguna"}. Ausentes: ${missingHeaders.length > 0 ? missingHeaders.join(", ") : "ninguna"}.`,
    current.toString(),
  );

  pushEvidence(
    "html",
    "HTML inicial limitado",
    `${body.bytes > 0 ? `${body.bytes.toLocaleString("es-CL")} bytes leídos` : "cuerpo vacío"}${body.truncated ? " (lectura truncada al límite)" : ""}. Título: ${titleTag ? `«${titleTag}»` : "no detectado"}. Idioma declarado: ${langAttr ?? "no detectado"}.`,
    current.toString(),
  );

  if (trackers.length > 0) {
    pushEvidence(
      "html",
      "Tecnologías de terceros detectadas",
      trackers.map((t) => `${t.name} (${t.count} referencia(s))`).join(" · "),
      current.toString(),
    );
  }

  if (setCookieList.length > 0) {
    for (const raw of setCookieList.slice(0, 12)) {
      const name = raw.split("=", 1)[0]?.trim() || "(sin nombre)";
      const flags: string[] = [];
      if (/httponly/i.test(raw)) flags.push("HttpOnly");
      if (/secure/i.test(raw)) flags.push("Secure");
      const sameSite = /samesite=(lax|strict|none)/i.exec(raw)?.[1];
      if (sameSite) flags.push(`SameSite=${sameSite}`);
      pushEvidence(
        "cookie",
        `Cookie «${name}» observada`,
        `Atributos declarados: ${flags.length > 0 ? flags.join(", ") : "ninguno de los esperados (HttpOnly/Secure/SameSite)"}.`,
        current.toString(),
      );
    }
  } else {
    pushEvidence(
      "cookie",
      "Sin cookies en la respuesta inicial",
      "El servidor no envió cabeceras Set-Cookie en esta solicitud. Esto NO prueba la ausencia de cookies en otras rutas o en dominios de terceros.",
      current.toString(),
    );
  }

  if (robotsStatus !== null) {
    pushEvidence(
      "robots",
      robotsStatus === 200 ? "robots.txt disponible" : `robots.txt respondió ${robotsStatus}`,
      `Estado HTTP ${robotsStatus}; ${robotsSitemaps > 0 ? `${robotsSitemaps} mapa(s) del sitio declarados.` : "sin declaraciones sitemap visibles."}`,
      new URL("/robots.txt", current.origin).toString(),
    );
  } else {
    pushEvidence("robots", "robots.txt inaccesible", "El robots.txt no respondió dentro del límite de tiempo.", current.toString());
  }

  if (body.truncated) {
    engineNotes.push("La lectura del HTML se truncó al límite de bytes configurado; la cobertura es parcial.");
  }
  engineNotes.push("Se inspecciona únicamente la página inicial; no se realiza crawling de rutas internas.");
  engineNotes.push("No se extrae contenido de la política de privacidad ni se evalúa su redacción.");
  engineNotes.push("Las relaciones con normativas son indicativas; PRIVACYOS no determina si una organización cumple la ley.");
  engineNotes.push(`Motor: PRIVACYOS ${ENGINE_VERSION}. Análisis real ejecutado sin red exterior simulada ni datos de muestra.`);

  /* 6 · Hallazgos basados en evidencia real */

  // 6.1 · Seguridad en el transporte
  pushEvidence(
    "sistema",
    "Evaluación completada",
    `Score y hallazgos derivados de ${evN} evidencias recopiladas bajo el motor ${ENGINE_VERSION}.`,
    "Interno",
  );

  const httpsOk = res.status < 400 && current.protocol === "https:";
  const hasHsts = headersSnapshot["strict-transport-security"] !== undefined;
  const hasCsp = headersSnapshot["content-security-policy"] !== undefined;
  const missingExtra = missingHeaders.filter((h) => /x-content-type|x-frame|referrer-policy/.test(h));

  if (!httpsOk) {
    pushFinding({
      title: "El destino no sirvió contenido por HTTPS cifrado",
      status: "riesgo_tecnico",
      severity: "alto",
      category: "seguridad",
      explanation: "La página final se obtuvo por HTTP sin cifrar, exponiendo el tráfico en la red local y en tránsito.",
      businessImpact: "Comunicaciones y datos de formularios podrían leerse en tránsito; los usuarios y su entorno confiable quedan expuestos.",
      evidenceIds: [httpResponseId],
      frameworks: frameworkRefsFor(input.frameworkIds, "seguridad"),
      recommendation: "Publica el sitio exclusivamente por HTTPS (certificado válido) y redirige el tráfico HTTP hacia HTTPS.",
      priority: "P2",
      limitation: "Riesgo técnico observado: no equivale a incumplimiento normativo por sí solo.",
    });
  }

  const seguridadRefs = frameworkRefsFor(input.frameworkIds, "seguridad");

  if (httpsOk && !hasHsts) {
    pushFinding({
      title: "Sin cabecera Strict-Transport-Security (HSTS)",
      status: "riesgo_tecnico",
      severity: "medio",
      category: "seguridad",
      explanation: "El sitio no fuerza conexiones exclusivamente seguras: una primera visita podría procesarse por HTTP antes de la redirección a HTTPS.",
      businessImpact: "Exposición potencial al descifrado de tráfico en la primera conexión y a degradación de SSL en redes comprometidas.",
      evidenceIds: [httpResponseId],
      frameworks: seguridadRefs,
      recommendation: "Añade la cabecera Strict-Transport-Security con max-age recomendado (≥ 31536000) y considera preload.",
      priority: "P2",
      limitation: "Observación técnica que refuerza el deber de medidas de seguridad; la adecuación exacta depende del marco aplicable y del contexto.",
    });
  }

  if (!hasCsp) {
    pushFinding({
      title: "Sin Política de Seguridad de Contenido (CSP)",
      status: "riesgo_tecnico",
      severity: "medio",
      category: "seguridad",
      explanation: "La ausencia de CSP elimina una barrera básica frente a scripts no deseados y a su propia cadena de dominios de terceros.",
      businessImpact: "Mayor superficie de ataque frente a inyecciones de código,las que podrían exponer datos recopilados.",
      evidenceIds: [httpResponseId],
      frameworks: seguridadRefs,
      recommendation: "Define e implementa una CSP en modo informar → restringir, empezando por el origen del sitio y los dominios legítimos.",
      priority: "P2",
      limitation: "Derin observación técnica; su pertinencia jurídica depende del marco aplicable y de la naturaleza del tratamiento.",
    });
  }

  if (missingExtra.length > 0) {
    pushFinding({
      title: "Cabeceras de refuerzo ausentes",
      status: "riesgo_tecnico",
      severity: "bajo",
      category: "seguridad",
      explanation: `No se observaron las cabeceras: ${missingExtra.join(", ")}.`,
      businessImpact: "Debilidad menor frente a codificación de contenido errónea y encuadramiento no autorizado.",
      evidenceIds: [httpResponseId],
      frameworks: seguridadRefs,
      recommendation: "Agrega X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN y Referrer-Policy con la política adecuada.",
      priority: "P3",
      limitation: "Observación técnica de buenas prácticas.",
    });
  }

  /* 6.2 · Cookies de la primera respuesta */
  const sessionish = /(session|sess|sid|csrf|token|jwt|auth|login|portal)/i;
  const sessionIssues: string[] = [];
  const otherIssues: string[] = [];
  for (const raw of setCookieList.slice(0, 12)) {
    const name = raw.split("=", 1)[0]?.trim() || "(sin nombre)";
    const cmp: string[] = [];
    if (!/httponly/i.test(raw)) cmp.push("HttpOnly");
    if (!/secure/i.test(raw)) cmp.push("Secure");
    if (!/samesite=\w+/i.test(raw)) cmp.push("SameSite");
    if (cmp.length > 0) {
      const detail = `${cmp.join(", ")} ausente(s)`;
      if (sessionish.test(name)) sessionIssues.push(`«${name}»: ${detail}`);
      else otherIssues.push(`«${name}»: ${detail}`);
    }
  }

  if (sessionIssues.length > 0) {
    pushFinding({
      title: "Cookies de sesión con atributos de seguridad incompletos",
      status: "riesgo_tecnico",
      severity: "alto",
      category: "seguridad",
      explanation: `Se observaron cookies susceptibles de sesión con: ${sessionIssues.join("; ")}.`,
      businessImpact: "Las cookies de sesión débiles facilitan robo de credenciales y riesgos CSRF si el sitio es el propio del usuario.",
      evidenceIds: evidence.filter((e) => e.kind === "cookie").map((e) => e.id),
      frameworks: [...seguridadRefs, ...frameworkRefsFor(["GDPR"], "seguridad")].filter(
        (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i,
      ),
      recommendation: "Configura las cookies de sesión con Secure, HttpOnly y SameSite=Lax o Strict, y revisa su expiración junto a la correspondiente preferencia de retención.",
      priority: "P2",
      limitation: "Solo se observó la respuesta inicial; la cobertura total de cookies del sitio es mayor.",
    });
  }

  if (otherIssues.length > 0) {
    pushFinding({
      title: "Buenas prácticas de cookies pendientes (no de sesión)",
      status: "riesgo_tecnico",
      severity: "medio",
      category: "seguridad",
      explanation: `Otras cookies observadas presentan: ${otherIssues.join("; ")}.`,
      businessImpact: "Mejora menor de la resiliencia y de la trazabilidad ante auditorías.",
      evidenceIds: evidence.filter((e) => e.kind === "cookie").map((e) => e.id),
      frameworks: seguridadRefs,
      recommendation: "Establece el atributo Secure y SameSite explícitos; revisa los dominios y propósitos de cada cookie.",
      priority: "P3",
      limitation: "Las cookies de dominios de terceros no son observables desde una consulta única.",
    });
  }

  /* 6.3 · Terceros observados */
  if (trackers.length > 0) {
    const listado = trackers.map((t) => t.name).join(", ");
    const reviews = frameworkRefsFor(input.frameworkIds, "terceros");
    pushFinding({
      title: `Tecnologías de terceros en la página inicial (${trackers.length})`,
      status: "riesgo_tecnico",
      severity: trackers.length >= 4 ? "alto" : "medio",
      category: "terceros",
      explanation: `Detectado: ${listado}. El código de estas tecnologías transmite señales de uso, en múltiples casos identificables, hacia sus proveedores.`,
      businessImpact: "Procesamiento de datos por terceros en nombre del responsable: debe informarse a titulares y documentarse (relación indicativa con deberes de información).",
      evidenceIds: evidence.filter((e) => e.kind === "html").map((e) => e.id),
      frameworks: reviews,
      recommendation: "Documenta cada tecnología de terceiros: finalidad, datos tratados y sede del procesador; verifica que la política de privacidad la describa y que exista base/título para su uso.",
      priority: "P2",
      limitation: "No se comparó con el texto de la política declarada del sitio: la consistencia o inconsistencia requiere revisión humana.",
    });
    if (scriptHosts.size > 6) {
      engineNotePush(engineNotes, `Se contaron ${scriptHosts.size} orígenes de scripts externos; se evaluaron las tecnologías con fines de privacidad identificables.`);
    }
  }

  /* 6.4 · Transparencia */
  if (privacyLink) {
    pushFinding({
      title: "Observación positiva: enlace a política de privacidad presente",
      status: "confirmado",
      severity: "bajo",
      category: "transparencia",
      explanation: `Se detectó un enlace cuyo texto/href refiere a privacidad: «${privacyLink.text.slice(0, 60)}» → ${privacyLink.href}`,
      businessImpact: "Señal de base de transparencia orientada al deber de informar a los titulares.",
      evidenceIds: evidence.filter((e) => e.kind === "html").map((e) => e.id),
      frameworks: frameworkRefsFor(input.frameworkIds, "transparencia"),
      recommendation: "Recomendación proactiva: verifica que la política detectada recoja las tecnologías de terceros observadas y los derechos de los titulares.",
      priority: "P4",
      limitation: "La DETECCIÓN del enlace no implica que el contenido de la política cumpla con los deberes de información.",
    });
  } else {
    pushFinding({
      title: "Enlace a política de privacidad no detectado en el HTML inicial",
      status: "insuficiente",
      severity: "medio",
      category: "transparencia",
      explanation: "Ningún enlace del HTML inicial refiere textualmente a una política de privacidad o tratamiento de datos.",
      businessImpact: "Un titular difícilmente podrá ejercer información; organizaciones con obligación de informar deberían revisar la accesibilidad de la política.",
      evidenceIds: evidence.filter((e) => e.kind === "html").map((e) => e.id),
      frameworks: frameworkRefsFor(input.frameworkIds, "transparencia"),
      recommendation: "Publica un enlace visible a la política de privacidad desde la página principal, con texto e idioma adecuados.",
      priority: "P2",
      limitation: "La política puede existir en otra ruta no enlazada inicialmente; la ausencia de detección NO prueba incumplimiento.",
    });
  }

  if (!metaDesc) {
    pushFinding({
      title: "Sin meta descripción declarada",
      status: "insuficiente",
      severity: "bajo",
      category: "transparencia",
      explanation: "No se encontró la etiqueta <meta name=\"description\"> en el HTML inicial.",
      businessImpact: "Impacto insignificante en privacidad; señala el grado de adopción de prácticas declaradas.",
      evidenceIds: evidence.filter((e) => e.kind === "html").map((e) => e.id),
      frameworks: [],
      recommendation: "Define una meta descripción con el propósito del sitio y el responsable del tratamiento si aplica.",
      priority: "P4",
      limitation: "Elemento informativo menor.",
    });
  }

  /* 6.5 · Gobernanza de robots */
  if (robotsStatus == null || robotsStatus >= 400) {
    pushFinding({
      title: "robots.txt inaccesible",
      status: "insuficiente",
      severity: "bajo",
      category: "gobernanza",
      explanation: "No se obtuvo un robots.txt válido en el origen del destino.",
      businessImpact: "Señala ausencia de señalización técnica básica para rastreadores y herramientas de análisis.",
      evidenceIds: evidence.filter((e) => e.kind === "robots").map((e) => e.id),
      frameworks: [],
      recommendation: "Publica un robots.txt con las directrices básicas y declaraciones sitemap.",
      priority: "P4",
      limitation: "El robots.txt puede no existir por decisión legítima del operador del sitio.",
    });
  }

  /* 7 · Puntaje explicable por dimensiones */
  const dims: Dimension[] = [
    {
      id: "seguridad",
      label: "Seguridad técnica",
      weight: 0.3,
      evaluated: true,
      value: clamp(100 - (!httpsOk ? 20 : 0) - (!hasHsts && httpsOk ? 25 : 0) - (!hasCsp ? 20 : 0) - missingExtra.length * 7),
      note: `HTTPS: ${httpsOk ? "sí" : "no"}; HSTS: ${hasHsts ? "sí" : "no"}; CSP: ${hasCsp ? "sí" : "no"}.`,
    },
    {
      id: "transparencia",
      label: "Transparencia de la información",
      weight: 0.25,
      evaluated: true,
      value: clamp(100 - (privacyLink ? 0 : 45) - (metaDesc ? 0 : 15) + (privacyLink && metaDesc ? 5 : 0)),
      note: `Enlace a política: ${privacyLink ? "detectado" : "no detectado"}.`,
    },
    {
      id: "terceros",
      label: "Intercambio con terceros",
      weight: 0.2,
      evaluated: true,
      value: clamp(100 - trackers.length * 12),
      note: `${trackers.length} tecnologías identificadas en la página inicial.`,
    },
    {
      id: "gobernanza",
      label: "Gobernanza básica",
      weight: 0.1,
      evaluated: true,
      value: clamp(70 - (robotsStatus === 200 ? 0 : 20) - (privacyLink ? 0 : 25) + (robotsStatus === 200 ? 30 : 0)),
      note: `robots.txt: ${robotsStatus === 200 ? "disponible" : robotsStatus == null ? "sin respuesta" : `estado ${robotsStatus}`}.`,
    },
    {
      id: "retencion",
      label: "Retención y minimización",
      weight: 0.15,
      evaluated: false,
      value: 0,
      note: "Requiere revisión del contenido de la política y del backend: fuera del alcance del motor de Hito 1 (se declara como no evaluada).",
    },
  ];

  const evaluated = dims.filter((d) => d.evaluated);
  const weightSum = evaluated.reduce((acc, d) => acc + d.weight, 0);
  const weighted = evaluated.reduce((acc, d) => acc + d.value * d.weight, 0);
  const score = Math.round(weighted / weightSum);

  const order: Array<Finding["severity"]> = ["critico", "alto", "medio", "bajo"];
  void order;
  const relevant = findings.filter((f) => f.status !== "preventivo" && f.title.startsWith("Observación positiva") === false);
  const top = resilientPrev(relevant);
  const riskLevel = top ?? (score >= 80 ? "bajo" : "medio");

  /* 8 · Plan de acciones priorizado */
  const recommendations: Recommendation[] = buildPlan(findings);

  const accessibility: AccessibilityInfo = {
    reachable: res.status < 400,
    finalUrl: current.toString(),
    httpStatus: res.status,
    redirects,
    responseBytes: body.bytes,
    durationMs,
  };

  const analysis: Analysis = {
    id: input.id && /^PS-[A-Z0-9]{6}$/.test(input.id) ? input.id : genId(),
    dataMode: "live",
    createdAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    input: { url: input.url, host: current.host, frameworkIds: input.frameworkIds },
    accessibility,
    dimensions: dims,
    score,
    riskLevel,
    evidence,
    findings,
    recommendations,
    engineNotes,
  };
  return { ok: true, analysis };
}

/* ── Helpers puros ── */

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
function genId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `PS-${out}`;
}
function findSevIdx(s: Finding["severity"]): number {
  return ["bajo", "medio", "alto", "critico"].indexOf(s);
}
function resilientPrev(findings: Finding[]): Finding["severity"] | null {
  if (findings.length === 0) return null;
  let max: Finding["severity"] | null = null;
  let bestIdx = -1;
  for (const f of findings) {
    const idx = findSevIdx(f.severity);
    if (idx > bestIdx) {
      bestIdx = idx;
      max = f.severity;
    }
  }
  return max;
}
function engineNotePush(list: string[], note: string): void {
  if (!list.includes(note)) list.push(note);
}
function buildPlan(findings: Finding[]): Recommendation[] {
  const positives = findings.filter((f) => f.title.startsWith("Observación positiva"));
  const actionable = findings.filter((f) => !positives.includes(f));
  const impactBySeverity: Record<Finding["severity"], Recommendation["impact"]> = {
    critico: "alto",
    alto: "alto",
    medio: "medio",
    bajo: "bajo",
  };
  const urgByPriority: Record<Finding["priority"], Recommendation["urgencia"]> = {
    P1: "inmediata",
    P2: "30_dias",
    P3: "90_dias",
    P4: "90_dias",
  };
  const effBySeverity: Record<Finding["severity"], Recommendation["effort"]> = {
    critico: "medio",
    alto: "bajo",
    medio: "bajo",
    bajo: "bajo",
  };
  const plan: Recommendation[] = actionable.map((f, i) => ({
    id: `R-${String(i + 1).padStart(2, "0")}`,
    title: f.title,
    action: f.recommendation,
    relatedFindingId: f.id,
    impact: impactBySeverity[f.severity],
    urgencia: urgByPriority[f.priority],
    effort: effBySeverity[f.severity],
  }));
  const positiveSteps: Recommendation[] = positives.map((f, i) => ({
    id: `R-M${String(i + 1).padStart(2, "0")}`,
    title: `Mantener: ${f.title.replace(/^Observación positiva: /, "")}`,
    action: "Revisa periódicamente que la buena práctica detectada se mantenga y se incorpore a las revisiones de privacidad de la organización.",
    relatedFindingId: f.id,
    impact: "bajo",
    urgencia: "continua",
    effort: "bajo",
  }));
  const orderOfUrgencia: Record<Recommendation["urgencia"], number> = { inmediata: 0, "30_dias": 1, "90_dias": 2, continua: 3 };
  return [...plan, ...positiveSteps].sort(
    (a, b) => orderOfUrgencia[a.urgencia] - orderOfUrgencia[b.urgencia],
  );
}
