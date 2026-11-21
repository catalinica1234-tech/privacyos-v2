# Despliegue y operación

## 1. Estado actual

| Entorno | URL | Estado |
|---|---|---|
| Producción | `https://privacyos-v2.vercel.app/` | Aplicación arriba; **base de datos caída**; estos cambios **no desplegados**. |
| Repositorio | GitHub `privacyos-v2` | Cambios locales sin commit ni push. |
| Base de datos | Supabase `kkzvpmhbkpeocxoppxtn` | Proyecto pausado/eliminado; `ENOTFOUND`. |
| Desarrollo local | `http://localhost:3000` | Funciona con Gemini real; persistencia degradada. |

**Nada de este documento autoriza a desplegar.** El despliegue, la migración y la rotación de claves requieren autorización explícita.

## 2. Variables de entorno

| Variable | Obligatoria | Ejemplo | Notas |
|---|---|---|---|
| `DATABASE_URL` | Sí (para persistir) | `postgresql://usuario:clave@host:5432/privacyos?schema=public&sslmode=require` | Secreta. Usar pooler en serverless. |
| `GEMINI_API_KEY` | Solo si el asistente está activo | `AIza...` | Secreta; server-side. |
| `ASSISTANT_ENABLED` | No | `1` / `0` | Si falta, el asistente se desactiva. |
| `ASSISTANT_MODEL` | No | `gemini-3.8-flash` | Debe existir en la cuenta. |
| `CONTACTO_EMAIL` | No | `contacto@dominio.cl` | Visible en la app; no es secreto. |
| `NEXT_PUBLIC_SITE_URL` | No | `https://privacyos-v2.vercel.app` | Metadata/canonical. |
| `ANALYZE_TIMEOUT_MS` | No | `8000` | Debe ser menor que `maxDuration`. |
| `ANALYZE_MAX_BODY_BYTES` | No | `512000` | Límite de lectura. |
| `ANALYZE_MAX_REDIRECTS` | No | `3` | Cada destino se revalida. |

## 3. Preparación de la base

### 3.1 Base nueva

```bash
npx prisma generate
npx prisma migrate deploy
# alternativa reproducible desde cero:
psql "$DATABASE_URL" -f db/init.sql
```

### 3.2 Base existente (migración de aislamiento)

```bash
# 1) Backup verificable
pg_dump "$DATABASE_URL" --format=custom --file=backup-privacyos-$(date +%Y%m%d).dump

# 2) Revisar la migración
cat prisma/migrations/20261102000000_workspace_isolation/migration.sql

# 3) Aplicar
npx prisma migrate deploy

# 4) Verificar
psql "$DATABASE_URL" -c '\d+ analyses' -c '\d+ sites'
```

La migración añade `ownerHash` nullable, índices y unicidad `(ownerHash, url)`. **No borra filas.** Las filas históricas quedan con `ownerHash NULL` y no son visibles para ningún espacio. Esta decisión evita asignar datos a un usuario arbitrario.

### 3.3 Rollback

- Si falla la migración: restaurar el backup y revertir el despliegue.
- Si falla la aplicación tras migrar: el esquema es retrocompatible con el código anterior (columnas nullable); se puede revertir el deploy sin bajar la migración.
- No usar `prisma migrate reset` en producción.

## 4. Despliegue en Vercel

```bash
# tras autorización explícita
git add -A
git commit -m "feat: aislamiento por espacio, motor seguro y accesibilidad"
git push origin main
vercel --prod
```

Checklist previo:

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` en verde.
- [ ] Backup de base realizado.
- [ ] `DATABASE_URL` apunta al pooler correcto y el proyecto Supabase está activo.
- [ ] `GEMINI_API_KEY` válida; `ASSISTANT_MODEL` existente.
- [ ] Migración revisada y aplicada.
- [ ] `/api/health` responde 200 tras el deploy.
- [ ] Prueba de CRUD con dos navegadores distintos (aislamiento).
- [ ] Verificar cabeceras con `curl -I`.

## 5. Verificación posterior

```bash
curl -sS https://privacyos-v2.vercel.app/api/health
curl -sSI https://privacyos-v2.vercel.app/ | grep -Ei 'content-security|permissions|strict-transport|x-frame'
```

| Verificación | Criterio |
|---|---|
| Health | `{ok:true, db:"ok"}` y 200. |
| Análisis | `POST /api/analyses` 201 y fila en DB. |
| Aislamiento | Cookie A no ve datos de B (404). |
| Asistente | Respuesta 200 con `answer`; 503 controlado si falta la clave. |
| Rate limit | 429 tras el límite. |
| UI | Skip link, alto contraste, tabs, modal. |

## 6. Operación

- **Backups:** Supabase diario + PITR si el plan lo permite; probar restauración trimestral.
- **Alertas:** health check externo cada 5 min; alerta de 5xx y latencia > 10 s.
- **Logs:** no registrar URLs completas con query sensible, preguntas del asistente ni claves. Revisar `console.error` existentes.
- **Rotación:** claves de Gemini/DB cada 90 días o ante sospecha.
- **Costo:** Vercel + Supabase + Gemini; ver modelo financiero.
- **Escalado:** si el tráfico crece, mover rate limit a Redis/KV y el motor a un worker con cola.

## 7. Runbook de caída de base

1. `/api/health` devuelve 503; la UI muestra modo local y permite analizar sin persistir.
2. Confirmar estado del proyecto Supabase (pausa, límite, credenciales).
3. Restaurar proyecto o actualizar `DATABASE_URL`; redesplegar si cambia la variable.
4. Aplicar migraciones pendientes.
5. Verificar health y CRUD.
6. Comunicar a usuarios: los análisis hechos en modo local no están en el servidor.

## 8. Limitaciones conocidas del despliegue

- Rate limit por instancia.
- CSP con `unsafe-inline`.
- Sin cuentas: la cookie es la única llave.
- Sin observabilidad avanzada (trazas/métricas).
- Sin entorno de staging dedicado; se recomienda crear uno antes de producción comercial.
