# Pruebas

| Evidencia | Alcance |
|---|---|
| [Plan técnico histórico](../testing/pruebas.md) y [registro de ejecución](../cierre/estado-ejecucion.md) | Resultados de la etapa anterior, con su entorno y fecha. |
| [Suite Vitest](../../tests/) | Contratos, solicitudes, seguridad del scanner, límites y asistente simulado. |
| [Script CRUD](../../scripts/test-crud.mjs) y [colección Postman](../HITO_2/pruebas/privacyos-hito2.postman_collection.json) | Pruebas HTTP de sitios y análisis con datos ficticios. |
| Consolidación local `20be094` | Typecheck, lint, build y 80 pruebas unitarias; 21 comprobaciones de CRUD en PostgreSQL desechable. Se verificaron por HTTP relectura y aislamiento entre dos workspaces. |
| Rama de seguridad `be37ee1` | Verificación separada con 82 pruebas y dos sesiones de Chrome. Los resultados corresponden a esa rama. |

Reproduce las pruebas desde la raíz con `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`. Para comprobar el CRUD, usa el servidor local y PostgreSQL de pruebas, siguiendo el [manual técnico](../HITO_3/manuales/manual-tecnico.md).

Quedan por acreditar la ejecución del evaluador en la versión de entrega, las pruebas equivalentes en un entorno protegido y la comprobación de Gemini con credenciales de pruebas. Consulta el [catálogo de capturas y Lighthouse](../evidencias/README.md).
