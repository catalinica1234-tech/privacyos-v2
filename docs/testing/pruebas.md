# Estrategia y resultados de pruebas

## 1. Pirámide

| Nivel | Herramienta | Alcance | Estado |
|---|---|---|---|
| Unitarias | Vitest 5 | Safety anti-SSRF, rate limit, CSRF/cuerpo, contratos, token de espacio. | **77/77 en verde** |
| Integración de datos | Prisma + PostgreSQL 16 local | Migración, CRUD, aislamiento por `ownerHash`, borrado. | **Ejecutado: 2 migraciones + 9 casos** |
| Runtime API | Servidor Next.js local + HTTP | Análisis real, SSRF, códigos, cabeceras, health. | **Ejecutado** |
| E2E de UI | Playwright (pendiente) | Flujos nuevo → progreso → informe → historial. | Pendiente |
| Accesibilidad | Lighthouse + revisión manual | Contraste, nombres, landmarks, teclado; axe/lector pendiente. | **Home 100 / Dashboard 100 en Lighthouse** |
| Carga/abuso | k6/Artillery (pendiente) | Rate limit, latencia, concurrencia. | Pendiente |

## 2. Comandos

```bash
npm ci
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run dev
```

## 3. Suites unitarias

| Archivo | Qué prueba | Casos |
|---|---|---|
| `tests/safety.test.ts` | URL válidas, protocolos, credenciales, puertos, blocklists IPv4/IPv6, formas decimales/hex/octales, expansión IPv6, resolución de literales. | 55 |
| `tests/rate-limit.test.ts` | Límite, ventana, aislamiento por IP y por operación, cubo sin IP. | 4 |
| `tests/request.test.ts` | Mismo origen, `Sec-Fetch-Site`, `Origin: null`, proxy, JSON, `+json`, cuerpo vacío/inválido/grande. | 11 |
| `tests/contracts.test.ts` | Contrato completo, score, evidencia obligatoria, marcos, respuesta ok/error, hash de espacio. | 7 |

**Resultado:** `Test Files 4 passed (4) · Tests 77 passed (77)`.

**Cobertura (v8) sobre módulos críticos:**

| Archivo | Statements | Branches | Lines |
|---|---|---|---|
| `safety.ts` | 80.45 % | 78.57 % | 87.9 % |
| `request.ts` | 80.85 % | 73.68 % | 82.22 % |
| `rate-limit.ts` | 74.19 % | 55.55 % | 80.76 % |
| Total | 80.07 % | 76.66 % | 85.92 % |

Las líneas no cubiertas son mostly ramas de error de DNS/red, pruning del mapa y caminos de `Referer`; se declaran.

## 4. Pruebas de runtime ejecutadas

| # | Prueba | Resultado |
|---|---|---|
| R-01 | `GET /` | 200; CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy con `microphone=(self)`. |
| R-02 | `GET /api/health` sin base | 503 `SERVICIO_DEGRADADO`, mensaje seguro. |
| R-02b | `GET /api/health` con PostgreSQL local | 200; `checks.database: "ok"`, `checks.assistant: "enabled"`. |
| R-03 | `POST /api/analyze` con `https://example.com` | 200; `dataMode: live`, HTTP 200, 577 bytes, score y evidencias reales. |
| R-04 | `POST /api/analyze` con `http://127.0.0.1/` | 403 `DESTINO_NO_SEGURO`. |
| R-05 | `POST /api/analyze` con `http://169.254.169.254/latest/meta-data/` | 403 `DESTINO_NO_SEGURO`. |
| R-06 | `POST /api/analyze` con `http://[::1]/` | 403 `DESTINO_NO_SEGURO`. |
| R-07 | `POST /api/analyze` con `http://localhost/` | 403 `DESTINO_NO_SEGURO`. |
| R-08 | `POST /api/analyze` con `http://metadata.google.internal/` | 403 `DESTINO_NO_SEGURO`. |
| R-09 | `POST /api/analyze` con `https://example.com:8443/` | 403 `DESTINO_NO_SEGURO`. |
| R-10 | `POST /api/analyze` con `file:///etc/passwd` | 403 `PROTOCOLO_NO_PERMITIDO`. |
| R-11 | `POST /api/analyze` con credenciales embebidas | 400 `URL_INVALIDA`. |
| R-12 | `POST /api/sites` con `Origin: https://evil.example` | 403 `ORIGEN_NO_PERMITIDO`. |
| R-13 | `POST /api/sites` con `Sec-Fetch-Site: cross-site` | 403 `ORIGEN_NO_PERMITIDO`. |
| R-14 | `POST /api/sites` con `Content-Type: text/plain` | 415 `TIPO_CONTENIDO`. |
| R-15 | `POST /api/sites` con cuerpo > 256 KB | 413 `CUERPO_DEMASIADO_GRANDE`. |
| R-16 | `POST /api/sites` con JSON inválido | 400 `VALIDACION`. |
| R-17 | 11 solicitudes a `/api/analyses` (límite 10/10 min) | 429 `DEMASIADAS_PETICIONES`; `Retry-After`, `X-RateLimit-*` presentes. |

> El servidor local se reinicia entre bloques para no contaminar la ventana de rate limit.

## 5. Integración con PostgreSQL local

Procedimiento reproducible:

1. Descargar binarios portables de PostgreSQL 16 (sin instalador ni admin).
2. `initdb -D <datadir> -U postgres --auth=trust --encoding=UTF8`.
3. `pg_ctl -D <datadir> -o "-p 55432" start`.
4. Crear base `privacyos_test`.
5. `$env:DATABASE_URL="postgresql://postgres@localhost:55432/privacyos_test"; npx prisma migrate deploy`.
6. Crear `.env.development.local` (ignorado por Git) con esa `DATABASE_URL`; arrancar Next en el puerto 3001.
7. Ejecutar las pruebas HTTP con dos frascos de cookies distintos.

**Migraciones aplicadas:** `20261026000000_init` y `20261102000000_workspace_isolation`.
**Resultado:** todas las migraciones aplicadas correctamente; `prisma migrate deploy` no borró filas.

| Caso | Resultado observado |
|---|---|
| `GET /api/health` | 200; base `ok`, asistente `enabled`. |
| `POST /api/sites` con cookie A | 201; sitio creado con `id` cuid. |
| `GET /api/sites` con cookie B | 200 `[]`; no ve el sitio de A. |
| `GET /api/sites/{id}` con cookie B | 404 `NO_ENCONTRADO`. |
| `POST /api/analyses` con cookie A y `siteId` propio | 201; motor real (`dataMode: live`); `id` de fila = `payload.id`. |
| `POST /api/analyses` con cookie B y `siteId` de A | 400 `VALIDACION`; no se permite enlazar a un sitio ajeno. |
| `GET /api/analyses/{id}` con cookie B | 404. |
| `PATCH /api/analyses/{id}` con A | 200; `notas` y `revisado` persistidos. |
| `PATCH /api/analyses/{id}` con B | 404. |
| `DELETE /api/sites/{id}` con análisis asociados | 409 `CONFLICTO_BORRADO` (FK RESTRICT). |
| `DELETE /api/analyses/{id}` con A | 204; posterior `GET` 404. |
| `DELETE /api/analyses` sin cabecera | 400 `CONFIRMACION_REQUERIDA`. |
| `DELETE /api/analyses` con `x-confirm-delete: workspace` | 200; `deleted.analyses` y `deleted.sites` correctos; A queda vacío. |
| Almacenamiento de `ownerHash` | Dos espacios distintos producen hashes SHA-256 de 64 caracteres, diferentes entre sí; la base no guarda el token. |
| Respuesta de análisis | Ya **no** expone `ownerHash` (se detectó fuga por spread y se corrigió). |

### Defectos encontrados y corregidos durante la prueba

1. **`/api/health` siempre 503 con base sana.** `prisma.$queryRaw` devuelve un arreglo, pero el código comparaba el resultado con `true`. Se corrigió a `query.then(() => true)` y se verificó con PostgreSQL local.
2. **Fuga de `ownerHash` en respuestas de análisis.** `toSummary` usaba spread de la fila completa. Ahora enumera solo campos públicos y una prueba de runtime confirma que `ownerHash` no aparece.
3. **Enlace de análisis a un sitio de otro espacio.** La FK no validaba pertenencia. Ahora el servicio comprueba `getSite(ownerHash, siteId)` antes de ejecutar el motor y responde 400 si no pertenece al espacio.
4. **Id de fila distinto del `payload.id`.** El servicio generaba un id nuevo en vez de usar el del motor. Ahora ambos coinciden y el informe se enlaza por el id correcto.

> La base de producción sigue caída, por lo que estos resultados son de PostgreSQL local. No se aplicó la migración ni se desplegó nada en producción.

## 6. Lighthouse (build de producción local)

Ejecutado con `next start -p 3002` y Chrome headless, sobre el build de producción (no sobre `next dev`). Los reportes están en `docs/evidence/`.

| Ruta | Performance | Accesibilidad | Best practices | SEO |
|---|---:|---:|---:|---:|
| `/` | 80 | **100** | 100 | 100 |
| `/app/dashboard` | 81 | **100** | 100 | 100 |

Correcciones que explican la mejora desde la primera medición:

1. Contraste insuficiente en pills de riesgo: se oscurecieron los tonos `risk-low`, `risk-med` y `risk-high` para superar 4.5:1 sobre sus fondos suaves.
2. `label-content-name-mismatch`: se eliminaron `aria-label` que no incluían el texto visible de la marca (Brand y app-shell); el icono “P” quedó `aria-hidden`.
3. `heading-order`: `EmptyState` usaba `h3` después de un `h1`; ahora usa `h2`.
4. Favicon 404: se añadió `app/icon.svg`.

**Límites:** Lighthouse es una medición de laboratorio, no de campo. No sustituye axe/Playwright ni una prueba con lector de pantalla. Los source maps de producción siguen deshabilitados a propósito (no se expone código); `valid-source-maps` no aparece como fallo en las rutas finales.

## 7. Matriz de riesgos de prueba

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Base de producción ausente | Alta | Alto | Bloqueante; restaurar antes de demo. |
| Rate limit no distribuido | Media | Medio | Documentar; Redis en producción. |
| Motor depende de red externa | Media | Medio | Timeout, errores claros, fallback sin persistencia. |
| Gemini no disponible | Media | Bajo | Asistente opcional; informe sigue. |
| Regresión visual | Media | Medio | Añadir Playwright + capturas. |
| Falsa sensación de cumplimiento legal | Media | Alto | Copy disclaimer en informe, asistente y docs. |

## 8. Pruebas que faltan (honestidad)

- Playwright E2E de los 5 flujos principales.
- axe-core en CI para todas las rutas.
- Regresión unitaria de `checkDatabase`, filtrado de `ownerHash` y ownership de `siteId`: hoy cubiertos por integración runtime, no por una prueba unitaria aislada.
- Prueba con lector de pantalla (NVDA/VoiceOver) y con persona mayor.
- Carga concurrente y verificación de rate limit entre instancias.
- Rotación de claves y simulacro de incidente.
- Migración sobre una copia real de producción (requiere backup y autorización).
- Verificación de correo/notificaciones (no implementadas).

## 9. Criterio de salida para el Hito 2

Se considera **listo para demo** si:

- [x] `typecheck`, `lint`, `build` en verde.
- [x] 77 pruebas unitarias en verde.
- [x] SSRF bloqueado en runtime.
- [x] Asistente responde server-side.
- [x] UI declara límites y no simula datos.
- [ ] CRUD probado en producción (bloqueado por base).
- [ ] E2E y axe en CI (pendiente).
