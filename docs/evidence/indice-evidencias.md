# Índice de evidencias

> **Regla:** cada evidencia tiene comando, archivo o salida reproducible. Las capturas de informe de muestra están marcadas como ilustrativas; no se presentan como análisis reales. La base de producción no está disponible, por lo que no hay evidencia de producción.

**Fecha de la última ejecución:** 2026-11-15. **Entorno:** Windows, Node.js 24, Next.js 15.5.28, PostgreSQL 16.9 portable, Chrome headless.

## 1. Calidad de código

| Evidencia | Comando | Resultado |
|---|---|---|
| Tipos | `npm run typecheck` | Sin errores. |
| Lint | `npm run lint` | Sin errores ni advertencias (se excluyó `coverage/**` y se corrigió un test). |
| Pruebas | `npm test` | **77/77 en verde**, 4 archivos. |
| Cobertura | `npm run test:coverage` | 80,07 % statements, 76,66 % branches, 85,92 % lines. |
| Build | `npm run build` | Exitoso; 12 rutas generadas. |
| CI | `.github/workflows/ci.yml` | Creado; **no ejecutado en GitHub** (sin commit/push). |

## 2. Pruebas unitarias y de seguridad

| Archivo | Qué cubre | Casos |
|---|---|---:|
| `tests/safety.test.ts` | Blocklists IPv4/IPv6, IPv4 mapeadas, NAT64, 6to4, Teredo, hostnames internos, protocolos, puertos, credenciales. | 55 |
| `tests/rate-limit.test.ts` | Límite por cubo/IP, ventana, `Retry-After`, aislamiento entre cubos. | 4 |
| `tests/request.test.ts` | CSRF por `Origin`/`Sec-Fetch-Site`, `Content-Type`, cuerpo, JSON inválido. | 11 |
| `tests/contracts.test.ts` | Contratos y token de espacio. | 7 |

`npm run test:security` ejecuta las suites de seguridad (safety, request, rate limit y contratos).

## 3. Pruebas HTTP de runtime

Servidor local con PostgreSQL: `http://localhost:3002` (build de producción) y `http://localhost:3001` (dev). Resultados:

| Caso | Resultado |
|---|---|
| `GET /` | 200; CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy. |
| `GET /api/health` con base local | 200; `database: ok`, `assistant: enabled`. |
| `GET /api/health` sin base | 503 `SERVICIO_DEGRADADO` (comportamiento correcto). |
| `POST /api/analyze` con `https://example.com` | 200; `dataMode: live`, HTTP 200, 577 bytes, evidencias reales. |
| SSRF: `127.0.0.1`, `localhost`, `[::1]`, `169.254.169.254`, `metadata.google.internal`, puerto 8443 | 403 `DESTINO_NO_SEGURO`. |
| `file:///etc/passwd` | 403 `PROTOCOLO_NO_PERMITIDO`. |
| URL con credenciales embebidas | 400 `URL_INVALIDA`. |
| `Origin` ajeno / `Sec-Fetch-Site: cross-site` | 403 `ORIGEN_NO_PERMITIDO`. |
| `Content-Type: text/plain` | 415 `TIPO_CONTENIDO`. |
| Cuerpo > 256 KB | 413 `CUERPO_DEMASIADO_GRANDE`. |
| JSON inválido | 400 `VALIDACION`. |
| 11 solicitudes a `/api/analyses` (límite 10/10 min) | 429 `DEMASIADAS_PETICIONES`; `Retry-After` y `X-RateLimit-*`. |

## 4. Integración PostgreSQL y aislamiento

- PostgreSQL 16.9 portable, puerto `55432`, base `privacyos_test`.
- Migraciones: `20261026000000_init` y `20261102000000_workspace_isolation`.
- Prisma `SELECT 1` verificado.
- Cookie A crea sitio y análisis; cookie B no los ve.
- B recibe 404 al pedir el sitio/análisis de A.
- B recibe 400 al intentar enlazar un análisis al `siteId` de A.
- PATCH de A funciona; PATCH de B da 404.
- DELETE de sitio con análisis da 409 (FK RESTRICT).
- DELETE de análisis de A da 204; B da 404.
- Purga sin `x-confirm-delete: workspace` da 400; con cabecera da 200 y borra análisis + sitios de A.
- `ownerHash` en base: 64 caracteres, distinto por espacio; la respuesta API no lo expone.
- Id de fila = `payload.id` (verificado `PS-ZBG923`).

**Defectos corregidos:** health siempre 503; fuga de `ownerHash` por spread; enlace a sitio ajeno; id de fila distinto del payload.

## 5. Accesibilidad

| Evidencia | Resultado |
|---|---|
| Lighthouse Home (build producción local) | Performance 80 · **Accesibilidad 100** · Best practices 100 · SEO 100. |
| Lighthouse Dashboard (build producción local) | Performance 81 · **Accesibilidad 100** · Best practices 100 · SEO 100. |
| Correcciones aplicadas | Contraste de pills de riesgo; `label-content-name-mismatch` en Brand y app-shell; `heading-order` en `EmptyState`; favicon 404. |
| Revisión manual | Skip link, tabs con flechas/Home/End, modal con focus trap/Escape, `aria-live`, alto contraste, zoom 200 %/320 px parcial. |

Reportes: [`lighthouse-home-final.report.html`](lighthouse-home-final.report.html), [`lighthouse-dashboard-final.report.html`](lighthouse-dashboard-final.report.html), y sus `.json`.

**Límites:** Lighthouse es laboratorio, no campo; no reemplaza axe/Playwright ni prueba con lector de pantalla. `valid-source-maps` y `errors-in-console` ya no aparecen en las rutas finales; los source maps siguen deshabilitados a propósito.

## 6. Capturas

| Archivo | Qué muestra | Nota |
|---|---|---|
| [`capturas/home.png`](capturas/home.png) | Landing con propuesta de valor y muestra ilustrativa. | Captura local. |
| [`capturas/dashboard.png`](capturas/dashboard.png) | Panel vacío de un espacio nuevo. | Captura local. |
| [`capturas/nuevo-analisis.png`](capturas/nuevo-analisis.png) | Formulario de análisis. | Captura local. |
| [`capturas/informe-muestra.png`](capturas/informe-muestra.png) | Informe `PS-SAMPLE`. | **Ilustrativo**, marcado “MUESTRA ILUSTRATIVA”; no es un análisis real. |

## 7. Modelo financiero

- `python scripts/generar-modelo-financiero.py` genera `docs/business/modelo-financiero.xlsx`.
- `python scripts/validar-modelo-financiero.py` reconstruye el modelo y compara: **todas las comprobaciones coinciden**.
- Base: VAN +CLP 96.916.480, TIR 70,33 %, payback 26 meses.
- Conservador: VAN −CLP 54.746.553, TIR −12,54 %, payback >36.
- Optimista: VAN +CLP 383.738.919, TIR 173,30 %, payback 20.
- Supuestos y lectura: [`../business/supuestos-modelo.md`](../business/supuestos-modelo.md).

## 8. Seguridad y secretos

- `safety.ts` y `http-safe.ts` con pruebas unitarias y de runtime.
- Escaneo del historial Git: sin claves vivas; solo placeholders en `.env.example`.
- `.env*` ignorado por Git. `.env.local` contiene la URL de producción y no se commitea.
- `npm audit`: 21 vulnerabilidades (16 moderadas, 5 altas); no se aplicó `--force`. Deuda declarada.

## 9. Producción

| Verificación | Resultado |
|---|---|
| `https://privacyos-v2.vercel.app/` | 200 (landing). |
| `/app/dashboard` | 200 (UI). |
| `/api/health` | 503 por base. |
| `/api/sites`, `/api/analyses` | 500 por base. |
| `/api/analyze`, `/api/assistant` | Funcionan con Gemini real. |
| Migración de aislamiento | **No aplicada**. |
| Deploy de estos cambios | **No realizado**. |

**Causa:** Supabase `kkzvpmhbkpeocxoppxtn` devuelve `FATAL: (ENOTFOUND) tenant/user ... not found` (proyecto pausado/eliminado). Sin `DATABASE_URL` válida no hay CRUD ni aislamiento en producción.

## 10. Qué no es evidencia

- Las capturas del informe de muestra no prueban un análisis real.
- Las cifras financieras no son resultados de clientes.
- Un 200 en la landing no prueba que la base funcione.
- Lighthouse 100 no es certificación WCAG.
- Las pruebas locales no sustituyen una prueba en producción.

> Para reproducir: [`../deployment/despliegue.md`](../deployment/despliegue.md), [`../testing/pruebas.md`](../testing/pruebas.md) y [`../cierre/estado-ejecucion.md`](../cierre/estado-ejecucion.md).
