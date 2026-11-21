# Integración PostgreSQL con Supabase

## Backend y esquema

La rama parte de la corrección de aislamiento `be37ee1`. Prisma 6.19.3 se inicializa en `lib/db.ts`; ese archivo es el punto de conexión del backend. Las rutas REST usan servicios y repositorios. El frontend consume la API del mismo origen.

| Objeto | Responsabilidad |
|---|---|
| `public.sites` | Sitios registrados, URL, nombre, notas, fechas y hash del workspace. Clave primaria por ID e índice único por `(ownerHash, url)`. Índice de propietario para listados. |
| `public.analyses` | URL, score, riesgo, notas, estado de revisión, fechas, propietario y contenido JSONB del informe, incluidos hallazgos, evidencias y recomendaciones. |
| `analyses.siteId → sites.id` | Relación opcional con borrado restringido mientras existan análisis asociados. El servicio verifica que el sitio pertenezca al mismo workspace antes de crear el vínculo. |
| Índices de análisis | `(ownerHash, createdAt DESC)` para historial, `createdAt DESC` y `siteId` conservados de la migración inicial. La clave primaria permite consultar el ID, con el propietario incluido en la condición. |

La API de sitios, el guardado y la consulta de informes, el historial, el panel, la comparación y el asistente contextual dependen de PostgreSQL. El scanner aislado, las páginas informativas y el informe de muestra pueden ejecutarse sin persistencia. El asistente general requiere credenciales Gemini si está habilitado.

El workspace se acredita mediante una cookie de posesión. Solo se guarda su hash y el servidor filtra por propietario. La cookie no identifica a una persona ni ofrece recuperación de cuenta. Los informes guardados se resuelven en el servidor antes de entregar contexto a Gemini.

## Migraciones

| Migración | Efecto |
|---|---|
| `20261026000000_init` | Crea tablas, claves, relación e índices iniciales. |
| `20261102000000_workspace_isolation` | Agrega propietarios anulables y unicidad de URL por propietario. Conserva las filas históricas sin propietario y las deja fuera de las consultas del producto. |
| `20261121000000_restrict_direct_data_api` | Activa RLS en ambas tablas y revoca permisos de tabla directos a `PUBLIC`, `anon` y `authenticated` si existen. No cambia filas ni otorga permisos. Se ejecuta en transacción. En PostgreSQL de pruebas sin roles Supabase también es aplicable. |

El producto no necesita extensiones PostgreSQL adicionales para los modelos actuales. Las dos migraciones históricas permanecen intactas. `db/init.sql` es un espejo para una base vacía. En destinos versionados, usa Prisma Migrate para registrar el historial.

La nueva migración restringe los canales directos al usuario web. La política de autorización por workspace se aplica también en los repositorios. Antes de la integración compartida, inspecciona políticas preexistentes, permisos de columna e indirectos, funciones o vistas expuestas y el rol SQL efectivo de la aplicación. RLS sin una política aplicable bloquea a los roles ordinarios. Un rol de runtime dedicado sin privilegios globales requiere permisos y políticas explícitos para el backend. Evita usar en el runtime una clave de la Data API o la credencial de administración de migraciones. La configuración de roles del proyecto necesita su propia revisión.

## Conexiones y variables

| Nombre | Uso | Dónde |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL para Prisma Client. En serverless, pooler de transacciones Supabase, normalmente puerto 6543 con `pgbouncer=true`. | Runtime de producción y preview, cada uno con su destino. Desarrollo apunta a su propia base. |
| `DIRECT_URL` | Prisma CLI. Conexión directa, o pooler de sesión en puerto 5432 si el ejecutor no alcanza el host directo. | Entorno autorizado de migraciones. En local puede coincidir con `DATABASE_URL`. El runtime de Next.js no necesita el valor. |
| `ASSISTANT_ENABLED` | `1` activa el asistente; omitir o usar `0` permite validar sin Gemini. | Configurar por entorno. |
| `GEMINI_API_KEY` | Credencial de servidor requerida solo si se habilita el asistente. | Gestor seguro de cada entorno que usa Gemini. |
| `ASSISTANT_MODEL` | Modelo preferido opcional. | Entorno de servidor correspondiente. |
| `ANALYZE_TIMEOUT_MS`, `ANALYZE_MAX_BODY_BYTES`, `ANALYZE_MAX_REDIRECTS` | Ajustes opcionales del scanner. El código provee valores por defecto. | Solo si se necesitan ajustes por entorno. |

Usa el gestor seguro para ambas URLs y verifica que, dentro de un mismo entorno, apuntan a la misma base y esquema. Configura TLS en las conexiones remotas según el panel y limita el pool por instancia según la capacidad contratada. Prisma 6 emplea `directUrl` para operaciones CLI que requieren conexión directa. Vercel aplica cambios de variables a despliegues nuevos. [Supabase y Prisma](https://supabase.com/docs/guides/database/prisma) · [Prisma 6](https://www.prisma.io/docs/orm/v6/reference/prisma-schema-reference) · [Entornos Vercel](https://vercel.com/docs/environment-variables)

## Verificación y puesta en servicio

1. **Identidad y estado.** Confirma el Project Ref y el aviso de estado en el panel. El destino indicado es `kkzvpmhbkpeocxoppxtn`. El conector actual devuelve falta de permisos para sus metadatos, esquema e historial. El estado `INACTIVE` observado en otra referencia no se atribuye al destino. Por ahora no se puede acreditar su conexión a PostgreSQL.
2. **Inspección de lectura.** Consulta versión, columnas, restricciones, índices, extensiones, roles, políticas, historial de migraciones y conteos agregados. Compara el resultado con Prisma. Confirma respaldo recuperable.
3. **Plan según el estado real.** En destino vacío, aplicar las tres migraciones. Si hay historial Prisma, ejecutar solo las pendientes tras comprobar deriva. Si ya hay tablas sin historial, comparar el esquema y preparar un baseline explícito; no marcar migraciones como aplicadas sin equivalencia verificada.
4. **Preview protegido.** Usar una base separada con datos ficticios y comprobar `/api/health`, CRUD, relectura tras reinicio, denegación cruzada, restricciones del canal directo y asistente. El health verifica que existan ambas tablas y columnas de propietario y que el rol las pueda consultar.
5. **Producción con autorización.** Mantener la contención aprobada, registrar variables por entorno, ejecutar migraciones fuera del build con el commit exacto, desplegar el candidato y repetir las verificaciones. Los despliegues antiguos que conservan sus variables y rutas requieren comprobación aparte.

**Reversión:** conservar el respaldo y un punto de retorno de las variables por entorno. Ante un fallo, mantener el bloqueo de datos o servir una versión informativa y conservar el esquema y las filas. Volver al backend público anterior reintroduciría el P0. Una restauración puede perder escrituras posteriores y requiere decisión explícita. La segunda migración permite URLs iguales en workspaces distintos, lo que puede impedir volver a un índice único global.

## Evidencia local y permisos del runtime

El 21 de noviembre de 2026, en PostgreSQL desechable, se aplicaron las tres migraciones y se verificó que las filas históricas ficticias conservaran su relación y contenido. Se comprobó que `anon` y `authenticated` perdieron los permisos directos de lectura y escritura sobre ambas tablas. Typecheck, lint, build, 82 pruebas unitarias, 21 comprobaciones CRUD y la prueba de dos sesiones Chrome pasaron.

Se repitió el aislamiento y la persistencia tras reinicio con un rol ordinario de runtime, sin `BYPASSRLS` ni privilegios globales. Este rol tenía `CONNECT`, `USAGE` sobre `public` y únicamente operaciones CRUD en las dos tablas, con políticas RLS explícitas para ese rol. Esas políticas autorizan al backend a operar sobre las tablas; los repositorios siguen siendo responsables de restringir cada consulta al workspace. Reservar este rol para el servidor. Mantener separadas las credenciales de migración y revisar que clientes web y otros roles no hereden los permisos.

- [Diagnóstico de catálogo de solo lectura](../../db/diagnostics/schema-readonly.sql). Consulta tipos, claves, índices, roles web, RLS y extensiones sin leer registros del producto. La validación del historial Prisma y el respaldo siguen separados.
- [Prueba de reinicio y aislamiento](../../scripts/test-workspace-restart.mjs). Desde la raíz, con un build generado y `DATABASE_URL` apuntando a la base desechable local `privacyos_integration`, ejecutar `node scripts/test-workspace-restart.mjs`. La prueba crea y retira sus propios registros ficticios. El escenario de Gemini comprueba el rechazo antes de contactar al proveedor; la ejecución real de Gemini requiere un entorno de pruebas autorizado.

Los nombres `NEXT_PUBLIC_SITE_URL` y `CONTACTO_EMAIL` aparecen en la plantilla histórica. En el código de esta rama no condicionan arranque, conexión ni aislamiento.
