# Defensa · 60 preguntas y respuestas

> **Cómo usar este documento.** Respuestas breves para defensa oral. Cada una distingue lo implementado, lo probado y lo pendiente. Si una cifra es un supuesto, se dice. Si algo no se pudo verificar, se declara “no verificable”. No memorizar como guion rígido: entender el porqué.

## Producto y alcance

**1. ¿Qué es PRIVACYOS?**
Una plataforma web que analiza señales técnicas observables de la página inicial de un sitio y las convierte en un informe explicable con score por dimensiones, evidencia, hallazgos y un plan de acción priorizado. No es un certificador ni un escáner exhaustivo.

**2. ¿Qué problema resuelve?**
Reduce la distancia entre evidencia técnica y decisión. Una pyme o una consultora no tiene tiempo para revisar cabeceras, cookies, terceros y transparencia con método; PRIVACYOS lo hace de forma acotada, repetible y legible.

**3. ¿Qué no hace?**
No rastrea todo el sitio, no atraviesa autenticación, no evalúa cumplimiento legal, no garantiza seguridad, no reemplaza a un abogado y no mide resultados de negocio. El alcance está declarado en la landing y en el informe.

**4. ¿En qué se diferencia de un escáner gratuito de cabeceras?**
En que no entrega solo un semáforo: entrega evidencia, explicación, límites de lo evaluado, priorización y un asistente que responde sobre el informe. Además, la accesibilidad y el lenguaje claro son parte del producto.

**5. ¿Quién es el usuario?**
El cliente inicial es una pyme digital o una consultora/estudio jurídico en Chile que necesita una primera foto defendible. El usuario técnico puede ser un DPO o alguien de marketing/legal sin equipo de seguridad.

**6. ¿Cómo se gana dinero?**
SaaS B2B con planes Esencial, Profesional y Consultora, más un diagnóstico único. Los precios son una **hipótesis comercial**: hoy no hay cuentas ni facturación implementadas.

**7. ¿Los precios son reales?**
No como precios vigentes. Son supuestos de planificación: 2,5 / 6 / 15 UF al mes y 10 UF el diagnóstico, con UF de referencia CLP 41.258,26. No hay clientes ni ingresos reales.

**8. ¿Cuál es el estado real del producto?**
Motor, API, persistencia, aislamiento, asistente y accesibilidad están implementados. El CRUD y el aislamiento se probaron contra PostgreSQL local. La producción sigue con la base Supabase caída, por lo que no se declara operativa.

**9. ¿Por qué el espacio de trabajo es anónimo?**
Porque en esta fase no hay cuentas. Se usa un token de capacidad en cookie HttpOnly y el servidor deriva un `ownerHash`; así hay aislamiento real sin inventar un sistema de identidad. Es una decisión de alcance, no una solución final.

**10. ¿Qué pasa si el usuario borra la cookie?**
Pierde el acceso al espacio y a sus análisis. No hay recuperación entre dispositivos ni rescate de workspace. Es una limitación comercial crítica y está declarada en Perfil y Configuración.

**11. ¿Hay login, registro o recuperación de contraseña?**
No. No se implementaron cuentas para no simular una seguridad que no existe. Es la prioridad 1 después de la demo.

**12. ¿Cuál es el roadmap?**
Primero restaurar la base de producción y aplicar la migración con autorización. Luego cuentas mínimas con recuperación, facturación, exportación PDF, Redis para rate limit, E2E/axe, pruebas con usuarios y revisión legal. Después: equipos, roles, API pública e integraciones.

## Arquitectura y motor

**13. ¿Qué stack usa?**
Next.js 15 con App Router, React 19, TypeScript, Tailwind, Prisma 6 y PostgreSQL/Supabase. El asistente usa Gemini solo del lado servidor. La tipografía es autoalojada.

**14. ¿Cómo está separado el código?**
Route handler → servicio → repositorio → Prisma. El motor de análisis está aislado en `lib/analyzer` y no conoce HTTP ni la base. La UI consume la API mediante un cliente con timeouts.

**15. ¿Cuál es el flujo de un análisis?**
El usuario ingresa una URL; el servidor valida sintaxis y seguridad, resuelve DNS, fija la IP, descarga la página inicial con límites, observa cabeceras/cookies/HTML/robots.txt, calcula dimensiones y hallazgos, y solo entonces persiste el informe.

**16. ¿El análisis es real o simulado?**
Real. El motor `1.0.0-sereno` hace solicitudes HTTP reales y registra evidencia con fuente y fecha. En la prueba de runtime, `https://example.com` devolvió HTTP 200, 577 bytes y evidencias observadas. No hay datos de demo inventados.

**17. ¿Qué evidencia genera?**
Resolución DNS validada, respuesta HTTP, cabeceras presentes/ausentes, cookies observadas, HTML limitado, `robots.txt`, enlaces de transparencia y tecnologías detectables. Cada evidencia indica qué se observó y su origen.

**18. ¿Cómo se calcula el score?**
Por dimensiones ponderadas: seguridad técnica 30 %, transparencia 25 %, terceros 20 %, retención/minimización 15 % y gobernanza 10 %. El score es una síntesis explicable, no una verdad absoluta ni una certificación.

**19. ¿Qué pasa si una dimensión no se puede evaluar?**
Se marca `evaluated: false`, no se inventa un valor y el informe lo declara. El score se calcula solo con lo evaluado y se advierte que la cobertura es parcial.

**20. ¿Cómo funciona el asistente?**
Recibe una pregunta y un contexto acotado del informe (truncado), con instrucciones para no inventar y para distinguir evidencia de interpretación. Responde en español y declara que no es asesoría legal.

**21. ¿Por qué Gemini solo en el servidor?**
Para no exponer la clave en el navegador y para poder aplicar límites, validación de origen, control de contexto y guardas anti-prompt-injection. El cliente nunca llama directamente al proveedor.

**22. ¿Cómo evitan que el asistente invente?**
Con instrucciones de sistema que prohíben inventar datos, contexto limitado al informe, respuesta de “no hay evidencia suficiente” cuando corresponde y disclaimers visibles. No es una garantía matemática: es mitigación y se prueba con casos.

**23. ¿Dónde se persiste?**
En PostgreSQL vía Prisma, en las tablas `sites` y `analyses`. Si la API/DB falla, la UI conserva un respaldo local y **avisa explícitamente** que el historial es local; no finge que se guardó en el servidor.

**24. ¿Por qué PostgreSQL y Prisma?**
Porque el Hito 2 exige persistencia real y consultas relacionales con integridad referencial. Prisma da migraciones versionadas y tipos; PostgreSQL es el servicio disponible (Supabase) y permite índices por `ownerHash` y fecha.

## Seguridad

**25. ¿Cómo previenen SSRF?**
Solo se permiten `http`/`https`, puertos 80/443, sin credenciales embebidas. Se resuelve DNS, se rechazan direcciones privadas, loopback, link-local, CGNAT, multicast, IPv4 mapeadas, NAT64, 6to4 y Teredo, y se bloquean hostnames internos. La conexión usa la IP validada, no una segunda resolución.

**26. ¿Cómo evitan DNS rebinding?**
Se resuelve el hostname, se validan **todas** las direcciones y se fija una IP pública en el socket, preservando SNI y `Host`. El cliente HTTP no vuelve a resolver el nombre. Así, un DNS que cambia entre la validación y la conexión no redirige a la red interna.

**27. ¿Qué pasa con las redirecciones?**
No se siguen automáticamente. Cada redirección se valida de nuevo (protocolo, puerto, destino, DNS) y se bloquea HTTPS→HTTP. Hay un máximo de saltos, deadline global y límite de bytes.

**28. ¿Y con IPv6?**
Se bloquean loopback (`::1`), link-local, unique local, multicast y rangos especiales. También se cubren IPv4-mapped, NAT64, 6to4 y Teredo para evitar bypass por transición de protocolo.

**29. ¿Por qué solo puertos 80 y 443?**
Porque el producto analiza sitios web públicos. Permitir puertos arbitrarios amplía la superficie de SSRF y no aporta al alcance. Un puerto no estándar se rechaza con `DESTINO_NO_SEGURO`.

**30. ¿Qué límites tiene la descarga?**
Timeout/deadline, máximo de bytes, máximo de redirecciones, solo página inicial y `robots.txt`. No se descargan binarios ni se ejecuta JavaScript del sitio. El HTML se procesa como texto, no se renderiza.

**31. ¿Cómo protegen contra CSRF?**
Se valida `Origin` y `Sec-Fetch-Site` en operaciones de escritura, se exige `Content-Type: application/json` y se usa cookie `SameSite=Lax` + HttpOnly. Las pruebas de runtime devolvieron 403 con origen ajeno y con `cross-site`.

**32. ¿El rate limit es suficiente?**
Es contención best-effort por instancia, en memoria. Frena ráfagas contra una misma instancia, pero **no** es distribuido. En producción multi-instancia se requiere Redis/KV; está documentado como limitación. Se verificó 429 con `Retry-After` y cabeceras `X-RateLimit-*`.

**33. ¿Cómo manejan secretos?**
Variables de entorno; `.env*` está ignorado por Git. El escaneo del historial no encontró claves vivas, solo placeholders en `.env.example`. La `GEMINI_API_KEY` nunca llega al cliente. No se rotaron credenciales porque no había evidencia de fuga.

**34. ¿Qué CSP usan?**
Una CSP de línea base con `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` y `connect-src 'self'`. Mantiene `unsafe-inline` para estilos/scripts; el endurecimiento con nonce + `strict-dynamic` queda documentado como siguiente paso, no como hecho.

**35. ¿Cómo aíslan los datos entre usuarios?**
Cada request obtiene el token de workspace, el servidor calcula SHA-256 y todas las consultas filtran por `ownerHash`. No se confía en un id enviado por el cliente. Un `siteId` ajeno se rechaza aunque la FK exista.

**36. ¿Qué otros controles HTTP tienen?**
Límite de cuerpo (413), rechazo de tipos no JSON (415), JSON inválido (400), same-origin, `no-store` en API, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy y COOP/CORP.

**37. `npm audit` reportó vulnerabilidades. ¿Por qué no las arreglaron?**
Se reportaron 21 (16 moderadas, 5 altas). No se ejecutó `npm audit fix --force` porque puede introducir cambios incompatibles y el alcance no autoriza modificaciones masivas. Queda como deuda técnica priorizada, no como “resuelto”.

**38. ¿Qué falta en seguridad?**
Rate limit distribuido, revisión de dependencias, CSP con nonce, observabilidad/alertas, prueba de carga, backup/restauración ensayada y un simulacro de incidente. También falta revisión legal del tratamiento de datos.

## Datos, privacidad y Ley 21.719

**39. ¿Qué es `ownerHash`?**
Un SHA-256 derivado del token de workspace. La base no guarda el token en claro. Es un identificador pseudónimo, no anónimo en sentido estricto: permite agrupar los datos de un mismo espacio.

**40. ¿Cómo se probó el aislamiento?**
Con dos frascos de cookies A y B contra PostgreSQL local: A crea sitio y análisis; B no los ve, recibe 404 al pedirlos y 400 si intenta enlazar un análisis a un sitio de A. La purga de A deja intacto a B.

**41. ¿Qué pasa con los datos históricos sin `ownerHash`?**
La migración añade la columna sin borrar filas. Las filas antiguas quedan con `ownerHash NULL` y dejan de ser visibles para cualquier espacio. No se borraron ni se reasignaron.

**42. ¿Cómo se borra un espacio?**
Con `DELETE /api/analyses` y la cabecera `x-confirm-delete: workspace`, en una transacción que borra análisis y sitios del `ownerHash`. Sin la cabecera responde 400. La UI pide confirmación en un modal y avisa si falla.

**43. ¿Cumple la Ley 21.719?**
No se declara cumplimiento. Se aplican principios de minimización, aislamiento, borrado y transparencia, y se evita vender “cumplimiento automático”. Falta revisión legal formal, base de licitud, retención definida y contratos con proveedores.

**44. ¿Qué datos se envían a Gemini?**
Un contexto acotado del informe y la pregunta del usuario, no la cookie ni el `ownerHash`. Aun así, es un proveedor externo: requiere revisión de términos, retención y transferencia. El asistente es opcional y se puede desactivar con `ASSISTANT_ENABLED=false`.

**45. ¿Cuánto tiempo se conservan los datos?**
Hoy no hay purga automática por antigüedad: se conservan hasta que el usuario vacía el espacio o se borra la base. Es una brecha frente a una política de retención formal y está declarada.

**46. ¿Usan cookies de analytics o consentimiento?**
No hay analytics de terceros ni cookies publicitarias. La cookie `privacyos_workspace` es esencial para el aislamiento. Aun así, la evaluación de consentimiento y la política de cookies requieren revisión legal antes de producción.

## Accesibilidad

**47. ¿Cumplen WCAG 2.2 AA?**
No se declara conformidad plena. Se implementaron ayudas sustanciales y Lighthouse dio 100 en accesibilidad en Home y Dashboard, pero falta auditoría axe/Playwright en todas las rutas, prueba con lector de pantalla real y revisión con usuarios.

**48. ¿Qué hicieron para lectores de pantalla?**
Landmarks, skip link, `main#contenido-principal`, labels explícitos, `aria-current`, `aria-live` en estados, roles en tabs/modal/meter/alert/log, nombres accesibles en iconos y jerarquía de encabezados corregida.

**49. ¿Cómo funciona el teclado?**
Tabs con roving tabindex, flechas, Home/End; modal con foco atrapado, Escape y restauración; foco visible; “Ver hallazgo” cambia de pestaña, hace scroll y enfoca la tarjeta. No hay gestos obligatorios.

**50. ¿Y el contraste?**
Se ajustaron los tonos de riesgo para superar 4.5:1 sobre sus fondos y se ofrece alto contraste conmutable que persiste antes del paint. Lighthouse ya no reporta `color-contrast` en las rutas medidas.

**51. ¿Qué piensan de adultos mayores?**
Base de 15 px, interlineado amplio, textos cortos, lenguaje simple, botones grandes, alto contraste y errores con sugerencia. Falta prueba con personas mayores reales; no se afirma que esté resuelto.

**52. ¿Y personas sordas?**
Todo el contenido es textual, no hay audio obligatorio y el dictado es opcional (produce texto). El video de demo debe llevar subtítulos. No hay intérprete de lengua de señas; se evalúa para Hito 3.

**53. ¿Qué falta en accesibilidad?**
E2E con axe en CI, prueba NVDA/VoiceOver, zoom 200 % y 320 px en todas las rutas, revisión de objetivos táctiles pequeños, lectura fácil validada y subtítulos/LSCh en material audiovisual.

## Pruebas, operación y negocio

**54. ¿Qué pruebas tienen?**
77 pruebas unitarias en Vitest: safety anti-SSRF (55), rate limit, CSRF/cuerpo y contratos/workspace. Typecheck, lint y build en verde. Cobertura de módulos críticos: 80,07 % statements, 76,66 % branches, 85,92 % lines.

**55. ¿Probaron SSRF en runtime?**
Sí: 8 payloads hostiles (localhost, 127.0.0.1, `[::1]`, 169.254.169.254, metadata.google.internal, puerto 8443, `file://`, credenciales embebidas) fueron rechazados con 403/400. No se probó contra una red interna real, por razones obvias.

**56. ¿Probaron la base de datos?**
Sí, con PostgreSQL 16.9 portable en el puerto 55432 y dos migraciones aplicadas. Se probaron CRUD, aislamiento, 404 cruzado, 409 por FK, purga con y sin confirmación y el `ownerHash` en la base. La base de producción no está disponible.

**57. ¿Qué dio Lighthouse?**
En build de producción local: Home 80 performance / 100 accesibilidad / 100 best practices / 100 SEO; Dashboard 81 / 100 / 100 / 100. Son medidas de laboratorio, no de campo, y no equivalen a certificación.

**58. ¿Por qué no está desplegado?**
Porque la base Supabase de producción está caída (`tenant/user ... not found`), la migración no se aplicó y no se pidió autorización para tocar producción, rotar credenciales o desplegar. El código local está listo; el entorno no.

**59. ¿Tienen CI?**
Se añadió `.github/workflows/ci.yml` con `npm ci`, `prisma generate`, typecheck, lint, tests, cobertura y build. **No se ejecutó aún en GitHub** porque no se hizo commit/push; localmente los mismos comandos pasan.

**60. ¿Cuál es el mayor riesgo y el próximo paso?**
El mayor riesgo es lanzar una demo sin base de producción y sin cuentas, generando una experiencia que se pierde. El próximo paso es restaurar/proveer la base, aplicar la migración con autorización, verificar CRUD/aislamiento en producción y luego construir cuentas mínimas con recuperación.
