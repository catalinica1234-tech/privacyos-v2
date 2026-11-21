# Evidencias y control de versiones

| Evidencia | Procedencia y alcance |
|---|---|
| [Capturas del producto](../evidence/capturas/) | Panel, inicio, formulario e informe ilustrativo. El informe de muestra documenta el recorrido visual. |
| [Lighthouse portada](../evidence/lighthouse-home-final.report.html) y [Lighthouse panel](../evidence/lighthouse-dashboard-final.report.html) | La serie del 15 de noviembre de 2026 corresponde a `localhost`, verificado en el JSON. El sufijo `prod` identifica una ejecución local y no certifica el sitio público. |
| [Índice de ejecución anterior](../evidence/indice-evidencias.md) | Registro histórico. Sus cifras y conclusiones sobre producción y Supabase corresponden a ese corte. El [índice de pruebas](../pruebas/README.md) identifica resultados por versión y entorno. |
| [Repositorio y arquitectura](../ARQUITECTURA/README.md) | Mapas, diagramas y decisiones. El SVG y PNG ofrecen formatos editables y de consulta de una misma pieza. |

## Inventario de originales y variantes

| Grupo | Disposición para la revisión |
|---|---|
| Expediente de rúbricas | Se verificaron por SHA-256 **21 copias exactas** frente al repositorio: cuatro de Hito 1, nueve de Hito 2 y ocho de Hito 3. Sus originales se conservan en sus rutas actuales. |
| Hito 1 · Mapa y diagrama | Las cuatro copias PNG y SVG del paquete de rúbricas coinciden por SHA-256 con los originales del clon. Los índices enlazan a los originales. |
| Hito 2 · API, modelo y Gantt | Se confirmaron copias idénticas del contrato REST, el diagrama ER y el Gantt entre el expediente y el repositorio. El plan y el análisis del Gantt son documentos distintos. |
| Hito 2 · PDF de 11 y 13 páginas | Los hashes son distintos. Preservar ambos y confirmar cuál se evaluó. El PDF de 13 páginas contiene identificadores personales. |
| Presentación HTML y PDF | Son formatos paralelos preservados en `docs/`. El PDF tiene historial de regeneración. Falta constancia de la versión exacta proyectada. |
| `informe privacyos final.pdf` | Archivo de 20 páginas formato carta, presente en Git desde octubre. Propuesta del Hito 1 según el contenido del informe. Se detectó contenido con formato de identificadores personales. |
| Hito 2 · Matriz interna anterior | [Autoevaluación histórica](../HITO_2/matriz-cumplimiento.md). Usar la [matriz oficial contrastada](../matriz-rubrica-ingt1003.md) como índice actual. |
| Lighthouse y auditorías | Se conservaron variantes HTML y JSON, capturas y registros. Los resultados previos no acreditan rendimiento, accesibilidad o conexión de la última versión publicada. |

Antes de compartir los PDF con identificadores, acordar con sus autores una copia adecuada para evaluación y el acceso a la versión original. Registrar el commit, entorno, fecha y resultado cuando se actualicen las evidencias.
