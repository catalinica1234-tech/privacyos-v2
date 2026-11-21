# PRIVACYOS · Contrato de la API REST (Hito 2)

Documento espejo de la tabla incluida en el informe técnico de `docs/`.
Todas las rutas responden `application/json` excepto los `204` (sin cuerpo).

## Convenciones

- Validación **Zod** (contratos compartidos en `lib/contracts.ts`) antes de tocar
  las capas internas.
- Errores con envolvente única:

```json
{ "ok": false, "code": "VALIDACION", "message": "..." }
```

- Nunca se devuelven stack traces ni detalles internos.
- **Versión:** el consumidor actual de la API es la propia SPA. Se introduce
  versionado de ruta (`/api/v1/…`) en el primer cambio incompatible o al
  aparecer un consumidor externo (API pública / móvil), manteniendo al menos
  una versión estable en paralelo. Hoy los recursos v1 responden prefijo-``/api`` sin ambigüedad.
- Autenticación: no forma parte del alcance mínimo del Hito 2 (como hasta el
  Hito 1, sin cuentas). Los recursos son de producto, no de sesión.

## Recurso `sites` — servicios web registrados para revisión

| Método | Ruta | Parámetros | Cuerpo (ejemplo) | Éxito | Errores |
|---|---|---|---|---|---|
| POST | `/api/sites` | — | `{"url":"https://www.chile.gob.cl","nombre":"Portal Chile","notas":""}` | **201** + site creado | 400 url/contrato inválido · **409 url duplicada** · 500 |
| GET | `/api/sites` | — | — | **200** + `{sites:[…]}` | 500 |
| PATCH | `/api/sites/{id}` | `id` | `{"notas":"revisar cookies de terceros"}` | **200** + site actualizado | 400 · 404 · 500 |
| DELETE | `/api/sites/{id}` | `id` | — | **204** | **404** · **409** si tiene análisis asociados (FK `RESTRICT`) · 500 |

## Recurso `analyses` — análisis de privacidad (motor + persistencia)

| Método | Ruta | Parámetros | Cuerpo (ejemplo) | Éxito | Errores |
|---|---|---|---|---|---|
| POST | `/api/analyses` | — | `{"url":"https://www.chile.gob.cl","siteId":"…(opcional)","frameworkIds":["CL-1928","CL-21719","GDPR"]}` | **201** + análisis completo (corre el motor y persiste; ~1–5 s) | 400 · 403 (guardas SSRF/protocolo/puerto → `code:"BLOQUEADO"`) · 500 · 504 timeout |
| GET | `/api/analyses` | query `limit` (default 50) · `siteId` | — | **200** + lista ordenada `createdAt` desc | 500 |
| GET | `/api/analyses/{id}` | `id` (formato `PS-XXXXXX`) | — | **200** + análisis completo | **404** · 500 |
| PATCH | `/api/analyses/{id}` | `id` | `{"notas":"priorizar hallazgo 2","revisado":true}` | **200** + análisis | 400 · **404** · 500 |
| DELETE | `/api/analyses/{id}` | `id` | — | **204** | **404** · 500 |

## Endpoint heredado del Hito 1 (se mantiene)

| Método | Ruta | Cuerpo | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/analyze` | `{"url":"…","frameworkIds":[…]}` | **200** + análisis (**sin persistir**, igual que el Hito 1; sirve para probar el motor aislado) | 400 · 403 · 500 · 504 |

La frontend usa `/api/analyze` salvo integraciones de Hito 2; `/api/analyses`
agrega persistencia (ver cambios vs Hito 1 en el informe técnico).

## Ejemplo de secuencia (demostración en vivo)

1. `POST /api/sites` → `201` (guarde `id`)
2. `GET /api/sites` → `200` (el creado aparece en la lista)
3. `PATCH /api/sites/{id}` → `200` (notas)
4. `POST /api/analyses` con ese `siteId` → `201` (motor + persistencia)
5. `GET /api/analyses?siteId={id}` → `200`
6. `PATCH /api/analyses/{id}` → `200`; `DELETE` → `204`; `GET` del borrado → `404`
7. `DELETE /api/sites/{id}` → `409` mientras exista su análisis · luego `204`

## Colección de pruebas

La colección exportada (Postman, importable) vive en
`docs/privacyos-hito2.postman_collection.json`, con variables de entorno
documentadas y peticiones encadenadas por scripts (extrae `id` de cada
respuesta automáticamente).
