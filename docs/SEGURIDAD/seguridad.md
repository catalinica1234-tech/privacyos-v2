# Seguridad y privacidad

**Referencias:** OWASP Top 10 (2021), OWASP ASVS 4.0 (selección), WCAG 2.2 AA, Ley 21.719 de Chile, RGPD. No se declara certificación ni cumplimiento legal pleno.

## 1. Modelo de amenazas (STRIDE)

| Amenaza | Escenario | Control | Estado |
|---|---|---|---|
| Spoofing | Cliente falsifica cabecera de espacio para leer datos ajenos. | Middleware borra y sobrescribe `x-privacyos-workspace`; cookie HttpOnly. | Implementado / probado unitario. |
| Tampering | Modificar o borrar análisis de otro espacio. | Filtro `ownerHash` en update/delete; purga con confirmación. | Implementado / probado local. |
| Repudiation | No hay trazabilidad de quién analizó qué. | No hay cuentas; se declara. Logs de servidor sin PII. | Limitación declarada. |
| Information disclosure | SSRF a metadatos, fugas de claves, errores verbosos. | Blocklists + IP fijada; claves server-side; errores genéricos. | Implementado / probado. |
| Denial of service | Análisis masivos, cuerpos gigantes, cabeceras lentas. | Rate limit, JSON ≤ 256 KB, deadlines, límites de bytes. | Parcial (rate limit por instancia). |
| Elevation of privilege | Inyectar cabecera o reutilizar cookie de otro. | Token 256 bits, HttpOnly, SameSite=Lax, hash en BD. | Implementado; no es autenticación. |

## 2. SSRF: defensa en profundidad

### 2.1 Validación de URL (`lib/analyzer/safety.ts`)

- Solo `http:` y `https:`.
- Sin usuario/contraseña embebidos.
- Solo puertos 80/443 (o ninguno).
- Longitud máxima 2048; hostname sin `%`, `\`, espacios.
- Blocklist de hostnames y sufijos internos: `localhost`, `.local`, `.internal`, `.lan`, `.corp`, `.home`, `.cluster.local`, metadatos de AWS/GCP/Azure, etc.
- IPv4: `0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.168/16`, `192.0.0/24`, TEST-NET, benchmarking, 6to4 relay, multicast, reservado y broadcast.
- IPv6: `::/96`, IPv4-mapped, NAT64, discard-only, Teredo, documentación, ORCHID, 6to4, ULA, link-local, site-local, multicast y todo lo que no sea global unicast `2000::/3`.
- Las formas decimales, hexadecimales y octales se normalizan por el parser URL y luego se clasifican (probado: `2130706433`, `0x7f000001`, `0177.0.0.1`).

### 2.2 Resolución y conexión

- `dns.lookup(host, { all: true })`; si **una sola** IP es privada, se rechaza el destino completo.
- `safeFetch` usa `node:http/https` con una función `lookup` que devuelve la IP ya validada: el socket no vuelve a resolver DNS (anti-rebinding).
- SNI y cabecera `Host` se mantienen con el hostname original.
- Redirecciones manuales (máx. 3): cada `Location` se resuelve contra la URL actual y se revalida con las mismas reglas.
- Se bloquea el downgrade HTTPS→HTTP.
- Deadline global, timeout de socket, límite de cabeceras (32 KB), cuerpo (512 KB), descompresión (1 MB) y número de redirects.
- Errores tipados; el mensaje al usuario no revela IPs internas ni detalles de red.

### 2.3 Pruebas hostiles ejecutadas

| Payload | Resultado |
|---|---|
| `http://127.0.0.1/` | 403 `DESTINO_NO_SEGURO` |
| `http://169.254.169.254/latest/meta-data/` | 403 `DESTINO_NO_SEGURO` |
| `http://[::1]/` | 403 `DESTINO_NO_SEGURO` |
| `http://localhost/` | 403 `DESTINO_NO_SEGURO` |
| `http://metadata.google.internal/` | 403 `DESTINO_NO_SEGURO` |
| `https://example.com:8443/` | 403 `DESTINO_NO_SEGURO` |
| `file:///etc/passwd` | 403 `PROTOCOLO_NO_PERMITIDO` |
| `https://user:pass@example.com/` | 400 `URL_INVALIDA` |

> Los códigos exactos pueden variar entre 400/403 según la versión; lo relevante es el rechazo. La suite unitaria cubre 55 casos de safety.

## 3. Autenticación, autorización y aislamiento

- **No hay autenticación de identidad.** Hay una capacidad aleatoria de 256 bits.
- Cookie `privacyos_workspace`: `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, `Path=/`, `Max-Age=31536000`.
- El middleware siempre sobrescribe la cabecera interna; un cliente no puede elegir el espacio de otro.
- `workspaceHash` valida `^[a-f0-9]{64}$` y deriva SHA-256 con prefijo de dominio.
- Repositorios: toda consulta incluye `ownerHash`; no existe un método “listar todo”.
- Filas históricas con `ownerHash NULL` quedan invisibles. No se borran.
- Purga total: `DELETE /api/analyses` exige cabecera `x-confirm-delete: workspace`, mismo origen y rate limit; borra análisis y sitios en una transacción.

**Riesgo aceptado:** quien robe la cookie puede acceder al espacio. No hay segundo factor. Es equivalente a un enlace capability; se documenta y se recomienda no usar en equipos compartidos.

## 4. CSRF, CORS y validación de entrada

- `assertSameOrigin`: rechaza `Sec-Fetch-Site: cross-site`; si hay `Origin`, debe coincidir con `Host`/`X-Forwarded-Host`; si no hay `Origin`, valida `Referer`; clientes no navegador sin ambos se aceptan, pero siguen obligados a la cookie.
- No se habilita CORS: el navegador solo puede llamar al mismo origen.
- JSON obligatorio (`application/json` o `application/*+json`), cuerpo ≤ 256 KB, JSON parseado con Zod.
- `analysisCreateSchema.url` exige URL válida; el motor vuelve a validar protocolo, puerto y red.
- IDs de análisis con formato `PS-[A-Z0-9]{6}`; IDs de sitio `cuid`.
- Errores de Prisma se mapean a 503/404/400 sin exponer SQL, credenciales ni tenant.

## 5. Rate limiting

| Operación | Límite | Ventana |
|---|---|---|
| `POST /api/analyze` | 10 | 10 min |
| `POST /api/analyses` | 10 | 10 min |
| `GET /api/analyses` | 120 | 1 min |
| `POST /api/assistant` | 12 | 10 min |
| `DELETE /api/analyses` (purga) | 5 | 10 min |
| Escrituras de sites | 30 | 10 min |

La clave es `sha256(operación:IP)`; la IP no se guarda en claro. `prune` acota el mapa a 10 000 claves.

**Limitación:** en Vercel cada instancia tiene memoria propia; no es un control distribuido. Para producción multi-instancia se requiere Redis/KV o el WAF del proveedor. Se declara en la UI y en este documento.

## 6. Cabeceras y transporte

| Cabecera | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; scripts/estilos self + inline (base); `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `upgrade-insecure-requests` en producción. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | cámara/geolocalización/pago/USB deshabilitados; micrófono solo mismo origen (dictado). |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-DNS-Prefetch-Control` | `off` |
| API | `Cache-Control: no-store, max-age=0` |

**Deuda:** CSP con `unsafe-inline` por los scripts inline de Next y el script de tema. Endurecer a nonce + `strict-dynamic` requiere refactor y pruebas. No se declara CSP estricta.

## 7. Secretos y dependencias

- `GEMINI_API_KEY` y `DATABASE_URL` solo en `.env.local`/Vercel; nunca en `NEXT_PUBLIC_*`.
- `.env.example` contiene placeholders.
- El asistente no registra la pregunta ni la respuesta en logs; el contexto se trunca y se validan marcos/evidencia.
- `poweredByHeader: false`.
- `npm audit`: 21 vulnerabilidades reportadas (16 moderadas, 5 altas) al momento de la auditoría; la mayoría en dependencias de desarrollo/build. **No se ejecutó `npm audit fix --force`** porque puede romper Next/Prisma. Queda como tarea de mantenimiento con revisión de changelog.
- Recomendación: activar Dependabot, fijar versiones y revisar CVEs antes de producción.

## 8. Privacidad y Ley 21.719

| Principio | Implementación | Brecha |
|---|---|---|
| Minimización | Solo se guarda URL, score, riesgo, payload técnico y notas; no se piden nombres para analizar. | El perfil local sí puede contener nombre/organización, pero no se envía. |
| Finalidad | Análisis de privacidad y historial del propio espacio. | Sin política de privacidad publicada ni DPO. |
| Seguridad | Aislamiento por hash, HTTPS, headers, rate limit. | Sin cifrado a nivel de columna ni auditoría de accesos. |
| Transparencia | La UI declara qué es real, qué es muestra y qué no se afirma. | Falta aviso de privacidad formal y base legal. |
| Derechos (acceso, rectificación, supresión) | Borrado local + remoto desde Configuración. | No hay exportación completa ni canal formal de solicitudes. |
| Retención | Sin retención automática; el usuario borra. | Falta política de retención y borrado por inactividad. |
| Transferencias | Gemini recibe contexto del informe (puede incluir URL y hallazgos). | Falta evaluación de transferencia internacional y contrato de encargo. |

**Declaración:** PRIVACYOS es una herramienta técnica de observación, no asesoría legal. No certifica cumplimiento ni sustituye una auditoría.

## 9. Respuesta a incidentes (runbook mínimo)

1. **Detección:** alerta de `/api/health` 503, errores 5xx, picos 429 o reporte de usuario.
2. **Contención:** rotar `GEMINI_API_KEY`/`DATABASE_URL` si hay sospecha; deshabilitar `ASSISTANT_ENABLED`; revocar despliegue.
3. **Erradicación:** corregir, probar, desplegar; si hay datos expuestos, invalidar cookies de espacio (no hay cuentas que bloquear).
4. **Recuperación:** restaurar base desde backup, verificar migraciones y health.
5. **Notificación:** evaluar obligación legal (Ley 21.719) con asesoría; no se afirma cumplimiento automático.
6. **Post-mortem:** sin PII en logs; registrar causa, impacto y acciones.

## 10. Checklist de seguridad para el próximo despliegue

- [ ] Restaurar/crear base y aplicar `prisma migrate deploy`.
- [ ] Verificar `/api/health` 200.
- [ ] Probar CRUD con dos cookies distintas (aislamiento).
- [ ] Rotar claves si estuvieron expuestas en algún momento.
- [ ] Confirmar `ASSISTANT_ENABLED` y modelo.
- [ ] Ejecutar `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- [ ] Revisar CSP en producción y `Permissions-Policy`.
- [ ] Configurar rate limit distribuido o aceptar la limitación por escrito.
- [ ] Activar backups y alertas de Supabase.
- [ ] Publicar aviso de privacidad y canal de derechos.
