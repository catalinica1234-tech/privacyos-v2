# Estado de ejecución

> Registro operativo para retomar el trabajo si se reinicia la conversación. No contiene credenciales.
> Última actualización: 2026-11-15.

## Entorno local de pruebas

| Elemento | Estado |
|---|---|
| PostgreSQL portable 16.9 | `C:\Users\BELEN\AppData\Local\Temp\opencode\pgsql-full\pgsql` |
| Datos | `C:\Users\BELEN\AppData\Local\Temp\opencode\pgdata2` |
| Puerto | `55432` |
| Base | `privacyos_test` |
| Migraciones | `20261026000000_init` y `20261102000000_workspace_isolation` aplicadas |
| Next.js local | `http://localhost:3002` (build de producción) / `3001` (dev) |
| Producción | `https://privacyos-v2.vercel.app` — Supabase caído; migración **no** aplicada |

### Arranque reproducible (Windows/PowerShell)

```powershell
$PG = "C:\Users\BELEN\AppData\Local\Temp\opencode\pgsql-full\pgsql"
$DATA = "C:\Users\BELEN\AppData\Local\Temp\opencode\pgdata2"
& "$PG\bin\pg_ctl.exe" -D $DATA -o "-p 55432" -l "$DATA\pg.log" start
$env:DATABASE_URL = "postgresql://postgres@localhost:55432/privacyos_test?schema=public"
$env:NEXT_PUBLIC_SITE_URL = "http://localhost:3002"
npm.cmd run build
npm.cmd run start -- -p 3002
```

> `next build` y `next dev` comparten `.next`: no ejecutarlos a la vez. Detener el servidor antes de build.

## Verificado

- `npm run typecheck`, `npm run lint`, `npm test` (77/77), `npm run build`: en verde.
- Cobertura: 80,07 % statements, 76,66 % branches, 85,92 % lines.
- `/api/health` 200 con base local (`database: ok`, `assistant: enabled`).
- CRUD, aislamiento A/B, 404 cruzado, 409 por FK, purga con confirmación y `ownerHash` de 64 caracteres.
- SSRF: 8 payloads hostiles rechazados; CSRF, 415, 413 y 429 verificados.
- Lighthouse build local: Home 80/100/100/100; Dashboard 81/100/100/100.
- Capturas en `docs/evidence/capturas/`.
- Modelo financiero validado contra reconstrucción Python: todas las comprobaciones coinciden.
- Documentos de Hito 2/Hito 3, video, 60 preguntas, informe de 26 preguntas y evidencias creados.
- CI en `.github/workflows/ci.yml` (no ejecutado aún en GitHub).

## Pendientes

1. **Producción:** restaurar/proveer Supabase, aplicar la migración, verificar `/api/health`, CRUD y aislamiento. Requiere autorización.
2. **Autorizaciones:** commit/push, deploy, rotación de credenciales, servicios de pago y borrado de datos.
3. **Producto:** cuentas mínimas con recuperación, facturación, exportación PDF, Redis/KV para rate limit, observabilidad.
4. **Pruebas:** E2E Playwright, axe en CI, carga concurrente, lector de pantalla y usuarios reales.
5. **Legal:** revisión Ley 21.719, retención, base de licitud y contratos con proveedores.
6. **Negocio:** pilotos pagados, CAC/churn reales y validación de precios.

## Archivos clave

- `docs/cierre/informe-final-26-preguntas.md`
- `docs/testing/pruebas.md`
- `docs/security/seguridad.md`
- `docs/evidence/indice-evidencias.md`
- `docs/business/supuestos-modelo.md`
- `.github/workflows/ci.yml`
- `prisma/migrations/20261102000000_workspace_isolation/migration.sql`
