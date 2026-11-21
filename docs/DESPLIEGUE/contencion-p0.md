# Contención del P0 de producción

Vercel sigue apuntando al commit `6026d265` en los alias informados. La auditoría anterior observó una lectura de datos sin workspace en `GET /api/analyses`. La revisión actual contrastó los filtros del código publicado y los metadatos del despliegue. Se evitó volver a consultar registros y realizar escrituras en producción.

| Ruta | Operaciones y alcance según el código publicado |
|---|---|
| `/api/analyses` | GET lista resúmenes sin propietario. POST crea análisis y permite relacionarlos con un sitio sin validar propiedad. Resúmenes incluyen URL, clasificación y datos de revisión. |
| `/api/analyses/[id]` | GET puede devolver el informe JSON con hallazgos y evidencias. PATCH y DELETE usan el ID sin filtrar propietario. Mutaciones inferidas por el código. |
| `/api/sites`, `/api/sites/[id]` | Listado, creación, lectura, edición y eliminación sin aislamiento. Pueden quedar expuestos nombres, URLs y notas. El borrado está sujeto a relaciones de base. |
| `/api/assistant` | La versión anterior recibe un informe del cliente. Puede procesar datos obtenidos por las rutas anteriores. |
| Vistas anteriores | Panel, historial, comparación e informe pueden mostrar copias que el navegador conservó. El firewall evita consultas nuevas, y el alcance de esas copias requiere tratarse por separado. |

La [propuesta local de regla](waf-contencion.propuesta.json) es declarativa. Con autorización, en Firewall de Vercel crear una regla **Deny** que coincida con cualquiera de las tres rutas base o sus descendientes y todos los métodos. Aplicar al alcance que cubra el alias principal, los alias alternativos, la URL propia del despliegue y cualquier despliegue público vulnerable. Identificar y revisar reglas de bypass ya existentes. Si no se puede cubrir un alias, protegerlo antes de dar por cerrada la exposición. Mantener accesibles la portada y las páginas informativas. Registrar impacto en historial, informes, sitios, comparación y asistente. [Documentación de reglas WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)

## Verificación después de autorizar

1. Inventariar alias y URL de despliegue en Vercel. En la última lectura se informaron `privacyos-v2.vercel.app`, `privacyos-v2-git-main-privacyos.vercel.app` y `privacyos-v2-privacyos.vercel.app`. Incluir despliegues históricos alcanzables.
2. Revisar en el panel el alcance, condiciones, precedencia y acción de la regla antes de aplicarla. Para el chequeo en vivo, usar `HEAD` en recursos de lectura y `OPTIONS` en la API de asistente, sin enviar cuerpos ni IDs reales. Incluir rutas base, barra final y ruta de recurso ficticio. Confirmar denegación atribuible a la regla en eventos del WAF. Un 404 de la aplicación por sí solo no acredita el firewall.
3. Confirmar que la portada responde. Las consultas o mutaciones con dos workspaces solo se prueban en preview protegido con datos ficticios. Mantener cerrada la versión vieja y verificar permisos de la Data API de Supabase por separado.
4. Mantener contención hasta que el candidato autorizado, su esquema y sus alias estén verificados. Preservar metadatos de incidentes bajo el acceso apropiado. Si falla el candidato, usar una versión informativa segura con los bloqueos activos.

[Despliegue público observado](https://vercel.com/privacyos/privacyos-v2/H7DA4tZgqbnQXBqwQPLWps7drmHr)
