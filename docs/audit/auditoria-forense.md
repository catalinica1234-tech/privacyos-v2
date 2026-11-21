# Auditoría forense y plan de corrección

**Fecha de corte:** 2026-11-02  
**Alcance:** repositorio `privacyos-serenidad` (remoto `privacyos-v2`), aplicación Next.js 15, API REST, motor de análisis, Prisma/PostgreSQL, asistente Gemini, UI y documentación.  
**Método:** lectura de código, ejecución de `typecheck`/`lint`/`build`, pruebas de runtime contra el servidor local, revisión de cabeceras, pruebas hostiles de SSRF/CSRF y revisión del estado de producción.

## 1. Línea base encontrada

| Componente | Estado inicial | Evidencia |
|---|---|---|
| Build, lint y tipos | En verde | `npm run build`, `npm run lint`, `npm run typecheck`. |
| Landing y dashboard | Respondían en producción | `https://privacyos-v2.vercel.app/` y `/app/dashboard`. |
| Motor `/api/analyze` | Funcional con red real | Análisis de `example.com` con evidencia y score. |
| Asistente `/api/assistant` | Funcional con Gemini real | Respuesta server-side; clave nunca en cliente. |
| CRUD `/api/sites` y `/api/analyses` | **Caído en producción** | HTTP 500 por base de datos inaccesible. |
| Base de datos | Proyecto Supabase pausado/eliminado | `FATAL: (ENOTFOUND) tenant/user postgres.kkzvpmhbkpeocxoppxtn not found`. |
| Aislamiento de datos | Inexistente | No había propietario ni filtro por usuario/espacio. |
| Seguridad del motor | Parcial | Validación de URL, pero cliente HTTP sin pinning DNS ni control fino de redirecciones. |
| Accesibilidad | Parcial | Buenos colores y foco, pero faltaban tablas ARIA, focus trap, alto contraste y etiquetas. |
| Pruebas automatizadas | Inexistentes | Sin Vitest/Playwright ni CI de pruebas. |
| Secretos en Git | Sin claves vivas | Solo placeholders en `.env.example`. |

## 2. Hallazgos priorizados

### Críticos

| ID | Hallazgo | Riesgo | Corrección |
|---|---|---|---|
| A-01 | Ausencia de aislamiento: cualquier cliente podía listar/borrar todos los análisis. | Confidencialidad e integridad. | Token de capacidad en cookie HttpOnly, hash SHA-256 en servidor y filtro `ownerHash` en todas las consultas. |
| A-02 | SSRF: el motor aceptaba destinos y redirecciones sin fijar la IP validada; DNS rebinding posible. | Acceso a red interna/metadatos. | `safety.ts` con blocklists IPv4/IPv6 y `http-safe.ts` con IP fijada, SNI/Host preservados, redirects revalidados y bloqueo HTTPS→HTTP. |
| A-03 | Producción sin base de datos operativa. | CRUD y persistencia no verificables. | Diagnóstico, health check y degradación explícita; restauración pendiente de autorización. |
| A-04 | Endpoints de escritura sin control de origen, tamaño ni tasa. | CSRF, abuso, agotamiento de recursos. | `assertSameOrigin`, JSON ≤ 256 KB, rate limit por operación y envolvente de error segura. |

### Altos

| ID | Hallazgo | Corrección |
|---|---|---|
| A-05 | La UI decía “no hay servidores” aunque el Hito 2 ya persistía. | Textos corregidos en dashboard, historial, configuración y perfil. |
| A-06 | Historial borraba solo localStorage aunque el análisis viviera en servidor. | Borrado local + remoto con rollback/aviso; purga de espacio con confirmación. |
| A-07 | Posible skeleton infinito en comparación si la API fallaba. | Timeout de fetch y estado `intentadas`; se muestra estado vacío. |
| A-08 | Fallback a `/api/analyze` no cubría el 503 de base caída. | Degradación explícita ante red o 503, avisando que no habrá persistencia. |
| A-09 | El asistente borraba la conversación al cerrar y no tenía etiqueta visible. | Persistencia en `sessionStorage`, label, logs ARIA, reintento y timeout. |

### Medios

| ID | Hallazgo | Corrección |
|---|---|---|
| A-10 | `microphone=()` bloqueaba el dictado por voz. | `microphone=(self)`. |
| A-11 | Fuentes servidas por Google Fonts. | Instrument Sans e Inter autoalojadas; CSP `font-src 'self'`. |
| A-12 | `Tabs` declaraba `aria-controls` sin paneles reales. | Cinco `tabpanel` persistentes, `aria-labelledby` y foco. |
| A-13 | “Ver hallazgo” apuntaba a un ancla en otra pestaña oculta. | Cambia a Hallazgos, abre y enfoca la tarjeta. |
| A-14 | Sin pruebas automatizadas ni CI. | Vitest + 77 pruebas + workflow de CI. |
| A-15 | `colorScheme` en `metadata` generaba advertencia de build. | Movido a `viewport`. |

## 3. Correcciones implementadas (resumen)

1. **Aislamiento real por capacidad:** `middleware.ts` genera/valida un token de 256 bits, lo pone en cookie `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS y lo propaga por cabecera interna que el cliente no puede falsificar. `lib/owner.ts` deriva SHA-256; Prisma y repositorios filtran por `ownerHash`.
2. **Migración** `20261102000000_workspace_isolation`: añade `ownerHash` a `sites` y `analyses`, índices y unicidad `(ownerHash, url)`. Las filas históricas quedan con `ownerHash NULL` e invisibles; no se borran.
3. **Motor endurecido:** blocklists IPv4/IPv6 (incluidas IPv4-mapped, NAT64, 6to4, Teredo, ULA, link-local), validación de hostname, resolución DNS de todas las direcciones y conexión a la IP validada. Redirecciones manuales, solo HTTP(S), sin HTTPS→HTTP, deadline duro, límites de cabeceras/cuerpo y descompresión acotada.
4. **API:** mismos controles en `/api/analyze`, `/api/analyses`, `/api/sites`, `/api/assistant`; health check; errores 429/503 seguros; cabeceras `no-store`; purga de espacio con confirmación explícita.
5. **Accesibilidad:** tabs con roving tabindex y flechas/Home/End; modal con focus trap, Escape y restauración; `Meter` con `role=progressbar`; alertas live; alto contraste; skip link; `aria-current`; etiquetas y errores descritos; foco visible.
6. **Privacidad:** fuentes locales, sin terceros en el navegador; asistente sin retención de claves; CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP/CORP.
7. **Pruebas:** 77 pruebas unitarias de seguridad, contratos, rate limit, CSRF, cuerpo y tokens; runtime con 8 payloads SSRF; CI.

## 4. Riesgos residuales (declarados)

| Riesgo | Estado | Mitigación / siguiente paso |
|---|---|---|
| Base de producción caída | Abierto | Restaurar Supabase o proveer nueva `DATABASE_URL`; aplicar migración; verificar CRUD. **Requiere autorización.** |
| Rate limit en memoria | Aceptado para esta fase | En multi-instancia migrar a Redis/KV. Documentado. |
| Sin cuentas ni recuperación entre dispositivos | Limitación de producto | El espacio se pierde al borrar cookies; se declara en UI y docs. |
| CSP con `unsafe-inline` | Aceptado con plan | Endurecer a nonce + `strict-dynamic`; requiere refactor de scripts inline. |
| Aislamiento no es autenticación | Limitación declarada | Token de capacidad; no hay segundo factor ni identidad. |
| Migración no aplicada en producción | Pendiente | No ejecutar sin autorización; backup previo. |
| Cobertura E2E/axe incompleta | Parcial | Añadir Playwright + axe con navegador real en CI. |
| Datos históricos invisibles | Aceptado | `ownerHash NULL`; no se borran; decisión documentada. |

## 5. Veredicto

El producto pasa de un prototipo con persistencia frágil y sin aislamiento a un **monolito modular con base de datos, API, motor seguro, asistente server-side y controles de acceso por espacio**. La brecha principal ya no es de código sino **operativa**: la base de producción no existe y el despliegue de estos cambios no se ha autorizado. Sin ese paso, el CRUD sigue sin poder demostrarse en producción, aunque sí quedó demostrado en PostgreSQL local.
