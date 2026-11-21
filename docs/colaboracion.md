# Cómo incorporar los entregables

## Elegir la carpeta

Abre el README de [Hito 1](hito-1/README.md), [Hito 2](hito-2/README.md) o [Hito 3](hito-3/README.md). Dentro de `entregables/` usa la carpeta del tipo de archivo:

| Carpeta | Qué incorporar |
|---|---|
| `informes/` | PDF aprobado del hito. |
| `anexos/` | Anexos separados; si están dentro del PDF, indícalos en su índice. |
| `presentaciones/` | Exportación aprobada de las láminas. |
| `videos/` | Archivo aprobado o ficha Markdown con enlace, título y duración. Comprueba acceso sin sesión si la entrega lo exige. |
| `capturas/` | Capturas aprobadas de la actividad o demostración. Indica qué muestran, fecha y entorno o commit cuando corresponda. |
| `complementos/` | Documentos de apoyo aprobados que corresponden al hito. |

Las auditorías son de trabajo interno. La [evidencia técnica transversal](evidencias/README.md) sigue separada de las capturas definitivas de cada hito. Los originales históricos conservan sus rutas.

## Nombrar y aprobar

1. Usa minúsculas, guiones y nombres sin espacios ni tildes: `hito-N-<tipo>-<tema>-v1.ext`. Los README de hito incluyen ejemplos. Para capturas, numera la secuencia: `hito-3-flujo-informe-01.png`.
2. El integrante a cargo de la pieza confirma con el equipo el archivo aprobado. Usa `v1` para la primera versión aprobada y aumenta a `v2` para correcciones posteriores. El enlace del README del hito identifica la versión vigente.
3. Revisa que enlaces y archivos abran con el nivel de acceso esperado. Usa datos ficticios para capturas de operación y revisa si aparecen identificadores personales, registros reales o secretos antes de compartir.
4. Cuando el archivo esté aprobado, incorpóralo en la carpeta del hito y actualiza su README con el enlace y una nota de versión. Para videos, agrega el enlace al README raíz cuando sea parte de la entrega.

Cada integrante aporta sus materiales en su propia rama o mediante el flujo de revisión acordado por el equipo. Mantén los cambios documentales separados de las ramas de seguridad e integración.
