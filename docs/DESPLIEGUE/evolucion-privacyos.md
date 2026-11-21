# Evolución funcional y verificación local

## Alcance

Rama `desarrollo/evolucion-privacyos`, basada en `9156a1c`. Las ramas académica, de aislamiento y de integración conservan sus referencias. Se reutilizaron las clases y componentes de Serenidad. La hoja global, los tokens, las fuentes y Tailwind conservan su configuración.

- **Asistente.** El servidor carga el informe dentro del workspace autorizado. Envía contexto reducido y hasta seis turnos acotados como datos de conversación. Conserva el dictado; el usuario revisa el texto antes de enviarlo. El modelo recibe score, pesos, hallazgos, evidencias identificadas, acción, impacto y prioridad. Una cita con un ID inexistente en el contexto se rechaza. La respuesta generada sigue siendo una explicación asistida. La evidencia de referencia es el informe, y Gemini requiere una credencial válida por entorno.
- **Score y evidencias.** El motor 1.1 conserva la fórmula ponderada y guarda sus propios resultados. Las dimensiones que dependen de una lectura HTML completa quedan fuera si no fue posible leerla; una respuesta HTTP sin éxito se muestra como fallo sin puntaje. Los informes históricos conservan sus valores y versión. El resumen muestra cobertura, operación ponderada y severidad separada del promedio.
- **Producto.** La landing y las pantallas de operación conducen al análisis real. Se retiró la ruta de muestra de la experiencia y se mantiene la fixture en las suites de pruebas. La gestión de sitios ofrece altas, cambios y borrado con confirmación, y puede iniciar un análisis vinculado a un sitio del workspace.
- **Normativa.** La referencia a la entrada en vigencia de las modificaciones de la Ley 21.719 se contrastó con [LeyChile](https://www.bcn.cl/leychile/navegar?f=2026-12-01&i=1209272). El informe interpreta señales técnicas y remite a revisión profesional para conclusiones jurídicas.

## Cotizaciones

La landing presenta Personal, Profesional, Business e Institucional como alcances referenciales. `POST /api/quotes` valida la solicitud, exige consentimiento, aplica un límite de 8 KiB, honeypot y cuota transaccional compartida en PostgreSQL. PostgreSQL guarda una fila por identificador de solicitud. Un reintento con el mismo contenido devuelve confirmación y uno con contenido distinto devuelve conflicto. El formulario confirma solo después del guardado. El reintento es idempotente durante la vida del formulario; una solicitud nueva inicia un identificador nuevo.

`20261122000000_quote_requests` crea la tabla independiente y su índice por fecha, activa RLS y revoca privilegios públicos. La API solo expone escritura de solicitud. El rol de runtime necesita `INSERT` y `SELECT` bajo RLS para confirmar reintentos; el usuario web no recibe lectura. No hay envío de correo, cobro ni suscripción. El equipo autorizado debe definir el canal operativo para revisar las solicitudes.

En Vercel, mantener `QUOTES_ENABLED=0` hasta acordar responsables de atención, retención y eliminación, confirmar el contacto y el aviso de tratamiento, preparar el rol de runtime y probar el circuito protegido. Para tráfico público, agregar en WAF un límite por IP que complemente el contador compartido, y configurar QUOTES_RATE_SECRET por entorno. Usar datos ficticios en preview. El modelo de cotización tampoco requiere enviar datos a Gemini.

## Preparación y reversión

1. Identificar el Supabase objetivo y verificar esquema, RLS y respaldo antes de solicitar la migración compartida. Revisar el [plan de integración](integracion-supabase.md).
2. Preparar preview protegido con PostgreSQL separado, las cinco migraciones, rol limitado y Gemini de pruebas. Confirmar CRUD, recarga, aislamiento, reintentos y cotización persistida. Verificar la configuración de servidor.
3. Contener las rutas de datos del despliegue público antiguo y conservar la contención hasta verificar el reemplazo. Ejecutar migraciones fuera del build y desplegar el SHA autorizado.
4. Ante un incidente de cotizaciones, desactivar la recepción en el entorno autorizado y conservar los datos. La migración es aditiva. No hace falta borrar la tabla para volver a una compilación segura que no la utilice. No recuperar el backend público antiguo como estrategia de rollback.

## Pruebas ejecutadas

- ESLint, TypeScript, Vitest (89 pruebas) y build de producción.
- PostgreSQL desechable con las cuatro migraciones, Prisma sin diferencias de esquema y un rol restringido por RLS. La auditoría de catálogo confirmó ausencia de acceso de lectura a cotizaciones para `anon` y `authenticated`.
- 21 comprobaciones CRUD. Chrome con dos sesiones verificó recorrido móvil, registro y edición de sitios, análisis real, informe tras recarga, historial, acceso directo, comparación y operaciones cruzadas rechazadas.
- La prueba de cotización confirmó persistencia, reintento idempotente, rechazo de una carga distinta con el mismo identificador, validación, honeypot, mismo origen y límite de solicitudes.
- El asistente se probó con un informe generado por el motor real y Gemini simulado, incluidas preguntas de seguimiento, error del proveedor y rechazo antes de consultar Gemini para un informe ajeno.
- Se verificó que el diff conserva hoja global, configuración Tailwind y fuentes. La comprobación de navegador se hizo en Chrome, incluida una ventana de 390 px. Queda pendiente una revisión visual ampliada en dispositivos y navegadores reales.

Consulta el [checklist vigente de preproducción](checklist-preproduccion.md) y el [procedimiento de contención](contencion-p0.md) antes de cualquier cambio externo.

## Evidencia del cierre técnico

- Candidato descendiente de `813dd56`, `be37ee1` y `9156a1c`. La rama `docs/organizacion-rubrica` conserva su trabajo separado.
- Typecheck, ESLint, build y 89 pruebas unitarias aprobados. Cinco migraciones y comparación Prisma sin deriva en PostgreSQL desechable.
- 21 comprobaciones CRUD, persistencia tras reinicio, dos sesiones Chrome y denegación cruzada de Gemini con proveedor simulado. [Prueba de reinicio](../../scripts/test-workspace-restart.mjs).
- [Prueba de cuota compartida](../../scripts/test-quotes-shared.mjs): ejecutarla solo con dos procesos locales en los puertos 3314 y 3315, la misma base desechable, el mismo `QUOTES_RATE_SECRET` y `QUOTES_ENABLED=1`. Verificó solicitudes concurrentes, rechazos de cuota, reintento idempotente después de agotarla, validación y mismo origen.
- Comparación Chrome del build candidato frente a `813dd56` a 390 y 1280 px: 13 de 16 capturas idénticas. Las diferencias se limitaron al ajuste de ancho y envoltura del panel e informe a 390 px, con y sin asistente. Se verificó que las pantallas revisadas no desbordaran en el candidato y que menú y FAQ funcionaran por teclado. Hojas de estilo, fuentes y tokens intactos.
- El ensayo de Gemini real se detuvo antes de realizar llamadas por falta de `GEMINI_TEST_API_KEY` y `GEMINI_TEST_MODEL`. El Supabase objetivo sigue denegando lectura desde el conector disponible. El P0 público sigue pendiente de contención autorizada.
