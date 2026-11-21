# Checklist de preproducción

## Estado y bloqueos

- [ ] Aplicar y comprobar la [contención P0](contencion-p0.md), previa autorización.
- [ ] Obtener acceso de solo lectura al Supabase `kkzvpmhbkpeocxoppxtn`. Verificar respaldo recuperable, roles, permisos, RLS, relaciones, índices y las cinco migraciones.
- [ ] Obtener un modelo y una clave Gemini de pruebas si se habilita el asistente en el candidato. Mantener la clave en el entorno de pruebas.
- [ ] Confirmar quién atiende las cotizaciones, el canal con acceso restringido y la política de retención. Mantener `QUOTES_ENABLED=0` en público durante esta preparación.
- [ ] Designar el SHA candidato y registrar las autorizaciones separadas de publicación, migración y despliegue.

## Preflight de datos

Ejecutar [diagnóstico de catálogo](../../db/diagnostics/schema-readonly.sql) con el MCP oficial restringido al proyecto. Comparar tablas, columnas, claves, índices, RLS y permisos efectivos con Prisma. Si existe `public._prisma_migrations`, consultar únicamente `migration_name`, `finished_at`, `rolled_back_at` y `applied_steps_count`. Confirmar respaldo desde el panel. La inspección debe excluir filas de usuarios, secretos y logs de migración con datos de conexión.

Comparar el destino de `DATABASE_URL` y `DIRECT_URL` mediante host, referencia y base en el gestor seguro. El pooler de transacciones se usa en runtime y la conexión directa o pooler de sesión para Prisma CLI. Un esquema preexistente sin registro Prisma necesita comparación y baseline explícito. No marcar migraciones aplicadas antes de comprobar equivalencia. Si el proyecto todavía bloquea el MCP, documentar el estado y mantener las pruebas en local.

## Gemini real en laboratorio

1. Crear una credencial de un proyecto de Google AI de pruebas, con cuota y presupuesto controlados. Introducirla en el gestor seguro o en la sesión local privada como `GEMINI_TEST_API_KEY`. Configurar `GEMINI_TEST_MODEL` con el ID simple del modelo que esa cuenta ofrece. Evitar reutilizar o exportar una clave de producción.
2. Preparar PostgreSQL desechable local `privacyos_evolution`, aplicar las migraciones solo allí y generar el build. Configurar `DATABASE_URL` únicamente para ese destino.
3. Ejecutar `node scripts/test-gemini-real.mjs`. El script verifica el modelo, crea un informe técnico sobre `example.com`, usa un proceso local con fallback desactivado, hace dos consultas contextualizadas y valida el rechazo de otro workspace antes de usar el proveedor. Revisa cualitativamente ambas respuestas contra su evidencia: alcance, limitación, continuidad y prioridad. El script no muestra la clave. Las pruebas negativas de cuota y respuesta inválida se ejecutan con proveedor simulado para controlar costo y reproducibilidad.
4. Mantener el tamaño de contexto y de salida acotados, el tiempo máximo del servicio y las métricas de cuota. Revisar que los logs y bundle no contengan valores secretos. [Guía de claves Gemini](https://ai.google.dev/gemini-api/docs/api-key)

## Cotizaciones y privacidad

El límite compartido usa PostgreSQL y funciona entre réplicas. Cada ventana fija de 30 minutos admite hasta cinco solicitudes nuevas por correo normalizado y cien globales. Se guarda HMAC para el contador de correo, separado de la tabla con la solicitud. El guardado y la cuota se confirman en una transacción. Los reintentos con el mismo identificador y contenido no consumen cuota, incluso si se agotó la ventana. La validación del cuerpo, el honeypot y el mismo origen se comprueban antes de abrir la transacción.

- **Runtime:** `QUOTES_ENABLED=1` solo en un entorno ya aprobado y `QUOTES_RATE_SECRET` aleatorio de al menos 32 caracteres, compartido por sus réplicas y distinto entre entornos. Rol servidor con SELECT e INSERT sobre solicitudes y SELECT, INSERT y UPDATE sobre ventanas, más sus políticas RLS. Roles públicos sin acceso directo. Cambiar el secreto reinicia la agrupación por correo, por lo que se coordina fuera de la ventana activa.
- **Antiabuso en el borde:** preparar una regla de rate-limit de `POST /api/quotes` por IP en WAF para cubrir tráfico inválido y muchos correos distintos. Ajustar el umbral con tráfico de pruebas y registrar falsos positivos. El tope global contiene el volumen total y puede reducir disponibilidad para usuarios legítimos bajo abuso. Ninguna regla se activó.
- **Recepción:** bandeja interna mediante un rol de revisión independiente, con lectura restringida en PostgreSQL y RLS. Confirmar responsable y proceso de seguimiento. No hay envío automático de correos ni endpoint de lectura público.
- **Retención:** antes de habilitar, aprobar un plazo documentado para solicitudes y otro breve para ventanas vencidas. Programar purga con rol operativo separado y alcance por fecha; ensayar conteos en preview, revisar datos sujetos a conservación y registrar solo conteos de eliminación. El runtime no necesita DELETE. La política y las eliminaciones requieren aprobación; actualmente no se ejecutan purgas automáticas.
- **Errores:** la API distingue validación, duplicado, conflicto, cuota y falta de disponibilidad. Los logs operativos deben registrar códigos y métricas, evitando correos, mensajes, identificadores de credenciales y cadenas de conexión. El cuerpo público confirma recepción solo después de persistir.

## Procedimiento de despliegue para una ventana autorizada

1. Congelar SHA, revisar el diff contra el remoto y comprobar que se conserva el aislamiento de `be37ee1` y la conexión de `9156a1c`. Ejecutar `npm ci`, `npx prisma generate`, typecheck, lint, tests y build. Reservar a los colaboradores la revisión de sus materiales.
2. Preparar preview protegido en base separada con datos ficticios. Validar health, CRUD, recarga, aislamiento de dos workspaces, asistente y cotizaciones. No usar la base compartida para pruebas de escritura.
3. Con autorización específica y respaldo verificado, ejecutar `npx prisma migrate status` y luego `npx prisma migrate deploy` fuera del build con el rol de migración y el destino confirmado. Aprobar antes los permisos RLS del rol de aplicación.
4. Con autorización para Vercel, configurar `DATABASE_URL` del pooler en Production y una URL distinta en Preview. `DIRECT_URL` se configura solo donde corre Prisma CLI. Mantener `QUOTES_ENABLED=0`. Configurar `ASSISTANT_ENABLED=1`, `GEMINI_API_KEY` y, si hace falta, `ASSISTANT_MODEL` solo cuando se valide la función en su entorno. Los ajustes `ANALYZE_*` son opcionales.
5. Con proyecto y equipo verificados, crear un candidato de producción protegido con `vercel --prod --skip-domain`; el comando evita asignar dominios, y la protección de acceso se comprueba aparte. Confirmar SHA, salud, configuración por nombres y registros sin secretos. Tras autorización de promoción, usar `vercel promote <deployment-id>`. [Despliegue y promoción](https://vercel.com/docs/cli/deploying-from-cli)
6. Verificar el cambio de alias, portada, health y controles acordados. Mantener el despliegue anterior inaccesible. Si falla, conservar el bloqueo y usar una versión segura o informativa previamente verificada. Las migraciones son aditivas; no eliminar tablas para hacer rollback ni exponer el backend anterior.
