# Matriz de cumplimiento · Hito 2

> **Advertencia:** no se encontró en el entorno la rúbrica oficial de INGT1003 para Hito 2/Hito 3. Esta matriz se construye sobre los requisitos declarados en el encargo, el README y las prácticas estándar de ingeniería. **No se presenta como pauta oficial.** Cuando el documento oficial esté disponible, se remapeará sin cambiar la evidencia.

## Leyenda

- **Implementado:** el código existe y es la ruta activa.
- **Probado:** existe una prueba reproducible con resultado registrado.
- **Documentado:** hay explicación en `docs/`.
- **Pendiente:** falta trabajo.
- **Pendiente de autorización:** requiere decisión del usuario (producción, credenciales, costos).
- **No verificable:** el entorno no permite comprobarlo.
- **Fuera de alcance:** se declara explícitamente.

## Matriz

| # | Requisito | Evidencia | Estado |
|---|---|---|---|
| 1 | Producto funcional sobre `privacyos-v2`, sin tercer proyecto | Repo y despliegue existentes; no se creó otro proyecto. | Implementado |
| 2 | Identidad Serenidad y funcionalidad Hito 1 conservadas | Paleta, tipografía, landing, dashboard, informe, muestra. | Implementado |
| 3 | Asistente IA central y obligatorio en la experiencia | `/api/assistant`, panel en cada informe, guía de uso. | Implementado / Probado |
| 4 | Gemini solo server-side | Clave en env; ninguna referencia `NEXT_PUBLIC`; ruta server. | Implementado / Documentado |
| 5 | Prohibidas respuestas simuladas o datos inventados | `dataMode`, evidencias obligatorias, notas de limitación, disclaimers. | Implementado |
| 6 | Persistencia real | Prisma + PostgreSQL; `/api/analyses`; local test. | Implementado / Probado local / Producción bloqueada |
| 7 | Evidencia real del motor | `EV-*` con fuente/fecha; `http-safe`; informe enlaza evidencia. | Implementado / Probado |
| 8 | Sin certificaciones o ventas ficticias | Copy y docs declaran ausencia de certificación y clientes. | Implementado |
| 9 | Accesibilidad adultos mayores | Base 15 px, alto contraste, lenguaje simple, objetivos grandes. | Implementado / Parcial |
| 10 | Accesibilidad personas ciegas | Skip link, landmarks, labels, ARIA, foco, estado live. | Implementado / Parcial |
| 11 | Accesibilidad personas sordas | Todo textual; dictado opcional; sin audio obligatorio. | Implementado |
| 12 | Accesibilidad motriz | Teclado completo, sin gestos obligatorios, botones amplios. | Implementado / Parcial |
| 13 | Accesibilidad cognitiva | Pasos, errores con sugerencia, confirmación, resumen simple. | Implementado |
| 14 | WCAG 2.2 AA como referencia | Matriz en `docs/accessibility`. | Documentado / Parcial |
| 15 | SSRF: IPs privadas y metadatos | Blocklists IPv4/IPv6 + pruebas. | Implementado / Probado |
| 16 | SSRF: DNS rebinding | IP fijada en socket + `lookup`. | Implementado / Probado unitario |
| 17 | SSRF: redirecciones | Manuales, revalidación, sin downgrade. | Implementado / Probado |
| 18 | Límites de tiempo/tamaño | Deadline, cabeceras, cuerpo, descompresión, redirects. | Implementado |
| 19 | Secretos fuera del repo | `.env.example` con placeholders; `.gitignore`; sin claves vivas. | Implementado / Auditado |
| 20 | Auth/aislamiento | Token de capacidad + `ownerHash` + filtros. | Implementado / Probado local |
| 21 | Rate limiting | `lib/rate-limit.ts` en rutas. | Implementado / Probado unitario / Limitación multi-instancia |
| 22 | CSRF / same-origin | `assertSameOrigin` + `Sec-Fetch-Site`. | Implementado / Probado |
| 23 | Validación de entrada | Zod + límites de cuerpo + formato de ID. | Implementado / Probado |
| 24 | Errores seguros | `routeError`, 429/503, sin SQL/tenant. | Implementado / Probado |
| 25 | OWASP Top 10 revisado | `docs/SEGURIDAD`. | Documentado |
| 26 | Ley 21.719 | Minimización, borrado, transparencia, límites. | Documentado / Parcial |
| 27 | CRUD `sites` | `/api/sites` + `[id]`. | Implementado / Probado local |
| 28 | CRUD `analyses` | `/api/analyses` + `[id]` + purga. | Implementado / Probado local |
| 29 | Migración reproducible | `prisma migrate` + `db/init.sql`. | Implementado / Probado local |
| 30 | Health check | `/api/health`. | Implementado / Probado (503 sin DB) |
| 31 | Degradación sin DB | Fallback a `/api/analyze` + aviso. | Implementado / Probado |
| 32 | Historial real + caché | Merge servidor/local, orden, detalle remoto. | Implementado |
| 33 | Borrado de datos | Individual y purga con confirmación. | Implementado / Probado local |
| 34 | Informe exportable | Markdown, JSON, impresión/PDF. | Implementado |
| 35 | Pruebas automatizadas | Vitest 77/77. | Implementado / Probado |
| 36 | CI | Workflow typecheck/lint/test/build. | Implementado (pendiente push) |
| 37 | Pruebas E2E | Playwright. | Pendiente |
| 38 | Accesibilidad automatizada | Lighthouse/axe. | Parcial |
| 39 | Documentación de arquitectura | `docs/ARQUITECTURA`. | Documentado |
| 40 | Documentación de seguridad | `docs/SEGURIDAD`. | Documentado |
| 41 | Documentación de pruebas | `docs/testing`. | Documentado |
| 42 | Guía de despliegue | `docs/DESPLIEGUE`. | Documentado |
| 43 | Guion de video 2 min | `docs/video`. | Documentado |
| 44 | 60 preguntas de defensa | `docs/defense`. | Documentado |
| 45 | 26 preguntas de cierre | `docs/cierre`. | Documentado (lista oficial no disponible) |
| 46 | Gantt y análisis | `docs/HITO_2/gantt-analisis.md`. | Documentado |
| 47 | Modelo financiero con fórmulas/escenarios | `docs/business/modelo-financiero.xlsx`. | Implementado / Documentado |
| 48 | Despliegue de cambios | Vercel. | **Pendiente de autorización** |
| 49 | Migración en producción | Supabase. | **Pendiente de autorización** |
| 50 | Cuentas/recuperación entre dispositivos | No implementado. | Fuera de alcance declarado |

## Brechas críticas para la nota

1. **Rúbrica oficial ausente:** no se puede garantizar que la matriz cubra 1:1 los criterios del profesor.
2. **Producción sin DB:** el CRUD no se puede demostrar en la URL pública hasta restaurar Supabase.
3. **Sin E2E/axe:** hay unitarias y runtime, pero no un pipeline de navegador.
4. **Sin cuentas:** si la rúbrica exige autenticación, no está cubierta; se declara como fuera de alcance de esta fase.

## Evidencia mínima para la defensa

- `npm test` → 77/77.
- `npm run build` → compilación y rutas.
- Captura de `/api/health` 503 con base caída.
- Captura de análisis real de `example.com`.
- Captura de rechazos SSRF (localhost, 169.254, IPv6, metadatos).
- Captura de informe con evidencia y asistente.
- Captura de Configuración con alto contraste y borrado confirmado.
- Logs de PostgreSQL local con dos espacios aislados.
