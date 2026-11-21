# Matriz de cumplimiento · INGT1003

**Fuente normativa:** `INGT1003_Proyecto_Semestral_2026_2S.html`, Universidad Mayor, segundo semestre de 2026. El HTML oficial fue consultado en `02_RUBRICAS_Y_HITOS/FUENTE-OFICIAL/` del paquete de continuidad. Ese archivo se conserva en su ubicación de origen. Ponderaciones, plazos y criterios se tomaron de esa fuente.

**Alcance:** contenido de la rama documental a partir de `20be094`, historial de Git y respaldos académicos recibidos. **Con evidencia** indica que el elemento se pudo confirmar en un archivo o prueba. **Parcial** identifica evidencia incompleta o una implementación que aún requiere validación. **Pendiente** indica que el entregable o comprobante no está disponible para acreditarlo. **No verificable** corresponde a la actuación en sala o a condiciones que requieren confirmación externa. Los estados no equivalen a una nota.

## Hito 1 · Propuesta · 30 %

Cierre **20 de septiembre de 2026, 23:59**. Presentaciones **21 al 23 de septiembre**. [Índice del hito](HITO_1/README.md).

| Criterio | Pts. | Estado | Evidencia y brecha |
|---|---:|---|---|
| A1 · Propuesta de valor | 15 | Parcial | Las láminas y el [README](../README.md#problema-y-propuesta-de-valor) explican problema y solución. Sin evidencia de la exposición en los primeros 90 segundos. |
| A2 · Prototipo | 10 | Parcial | El [mapa](HITO_1/mapa-producto/mapa-producto.svg), las pantallas actuales y las [capturas](evidencias/README.md) respaldan el recorrido. Falta acreditar el prototipo mostrado en el Hito 1 y sus tres pantallas encadenadas. |
| A3 · Arquitectura de información | 8 | Parcial | [Mapa del producto](HITO_1/mapa-producto/mapa-producto.svg) con navegación. Falta comprobar cómo se usó en la exposición. |
| A4 · Tiempo y formato | 7 | No verificable | Requiere registro de la presentación, duración y participación. |
| A5 · Respuesta individual | 10 | No verificable | Requiere evidencia de la respuesta del integrante seleccionado. |
| B1 · Estructura formal | 8 | Parcial | Hay un PDF de 20 páginas formato carta, localizado por su nombre y fecha como candidato de una etapa temprana. Falta confirmar que corresponde a la entrega del Hito 1 y cotejar su estructura con el Anexo A. |
| B2 · Problema y evidencia | 10 | Parcial | Problema y destinatarios identificables. Falta verificar fuentes sectoriales o chilenas, cifras y citas del expediente de Hito 1. |
| B3 · Arquitectura cliente-servidor | 12 | Parcial | [Diagrama inicial](HITO_1/arquitectura/diagrama-arquitectura.svg) disponible. Falta confirmar el caso de uso por capas en la versión entregada. |
| B4 · Lenguajes y frameworks | 10 | Parcial | El stack está documentado. Falta acreditar la comparación de alternativas, criterios y desventaja asumida en este hito. |
| B5 · Edición y marca | 6 | Parcial | Las [láminas disponibles](HITO_1/presentacion/PRIVACYOS_Presentacion.pdf) y el prototipo comparten identidad visual. Falta revisar la versión de entrega y su legibilidad editorial. |
| B6 · Bibliografía y citas | 4 | Parcial | Se localizaron referencias en los archivos PDF. Falta cotejar citas, fuentes y formato APA 7. |

## Hito 2 · Back end · 35 %

Cierre **30 de octubre de 2026, 23:59**. Presentaciones **2 al 6 de noviembre**. [Índice del hito](HITO_2/README.md).

| Criterio | Pts. | Estado | Evidencia y brecha |
|---|---:|---|---|
| A1 · Demostración REST en vivo | 15 | Parcial | [Colección Postman](HITO_2/pruebas/privacyos-hito2.postman_collection.json) y [script CRUD](../scripts/test-crud.mjs). Hay verificación local posterior. Falta evidencia de las cuatro operaciones ejecutadas en sala con el dato persistido. |
| A2 · Justificación tecnológica | 12 | Parcial | [Arquitectura y decisiones](ARQUITECTURA/arquitectura.md#7-decisiones-de-arquitectura-adr-resumidas) e [informe técnico disponible](HITO_2/documento-tecnico/hito2-informe.pdf). Falta cotejar alternativas y costos asumidos en la defensa. |
| A3 · Monolito o distribuido | 8 | Parcial | Código y documentación respaldan monolito modular. Falta acreditar la justificación oral sobre carga, equipo, costo y despliegue. |
| A4 · Claridad técnica y tiempo | 5 | No verificable | Hay un [guion de siete minutos](HITO_2/hito2-guion.md). La ejecución se acredita con la presentación. |
| A5 · Respuesta individual | 10 | No verificable | Requiere evidencia de la respuesta del integrante seleccionado. |
| B1 · Trazabilidad con Hito 1 | 8 | Parcial | La API, Prisma y PostgreSQL evidencian el cambio respecto del prototipo. Falta cotejar qué cambió, por qué y con qué impacto en la versión enviada. |
| B2 · Diseño de API REST | 14 | Con evidencia | [Contrato REST](HITO_2/api/README.md) y [colección](HITO_2/pruebas/privacyos-hito2.postman_collection.json) con rutas, cuerpos, estados y convención de versionado. Confirmar que el PDF refleje el contrato del hito y actualizar una referencia separada al comportamiento del commit de entrega. |
| B3 · Separación de capas | 12 | Con evidencia | [Rutas](../app/api/), [servicios](../lib/services/) y [repositorios](../lib/repositories/), con [flujo documentado](ARQUITECTURA/arquitectura.md#4-flujo-de-análisis-persistido). |
| B4 · Persistencia y credenciales | 10 | Con evidencia | [Prisma](../prisma/schema.prisma), [modelo relacional](../db/erd.mmd), [SQL](../db/init.sql) y [variables de ejemplo](../.env.example). Persistencia verificada en PostgreSQL desechable. La condición del historial completo de secretos requiere una revisión aparte. |
| B5 · Referencias técnicas | 6 | Parcial | Los informes contienen referencias. Falta verificar fuentes originales, norma y su vínculo con decisiones. |

## Hito 3 · Producto funcional · 35 %

Cierre **27 de noviembre de 2026, 23:59**. Proyección y revisión **30 de noviembre al 4 de diciembre**. [Índice del hito](HITO_3/README.md).

| Criterio | Pts. | Estado | Evidencia y brecha |
|---|---:|---|---|
| A1 · Recorrido de punta a punta | 18 | Parcial | [Verificación local](pruebas/README.md) de CRUD, persistencia y relectura. Las pruebas en navegador más recientes corresponden a la rama de seguridad. Falta la evidencia del recorrido por el evaluador en la versión de entrega. |
| A2 · Integración por capas | 12 | Con evidencia | [Arquitectura](ARQUITECTURA/arquitectura.md), [API](../app/api/) y [repositorios](../lib/repositories/) muestran la separación. |
| A3 · Validación, errores y estados | 8 | Parcial | [Contratos](../lib/contracts.ts), vistas, [suites](../tests/) y [capturas](evidencias/README.md). Consolidar el recorrido de carga, vacío y error en la versión final. |
| A4 · Ejecución o despliegue | 7 | Parcial | Build local y [guía reproducible](HITO_3/manuales/manual-tecnico.md). Falta ejecución por un tercero o evidencia del flujo completo en la versión publicada. |
| A5 · Repositorio e historial | 5 | Parcial | Hay historial y ramas locales. Falta confirmar todos los usuarios y aportes, acceso del docente, enlaces definitivos y revisión de credenciales. |
| B1 · Documento final | 12 | Pendiente | No se pudo acreditar un PDF final de Hito 3. Un PDF con «final» en el nombre ya estaba en Git en octubre y no debe atribuirse al Hito 3 por su nombre. |
| B2 · Arquitectura y evolución | 12 | Parcial | Existen [diagramas y decisiones](ARQUITECTURA/README.md). Falta cotejar el diagrama final y la bitácora H1 → H3 con el estado que se entregará. |
| B3 · Manuales | 6 | Parcial | [Manual de uso](HITO_3/manuales/manual-de-uso.md), [manual técnico](HITO_3/manuales/manual-tecnico.md) y resumen en el README. Falta validación por un tercero. |
| B4 · Video promocional | 14 | Pendiente | No se localizó un video final ni enlace público verificable. Falta comprobar los primeros 120 segundos, demostración, legibilidad y créditos. |
| B5 · IA y datos personales | 6 | Parcial | [Material técnico de seguridad](SEGURIDAD/README.md) y un antecedente de declaración de IA en un PDF de Hito 2. Falta el anexo final del Hito 3 con herramientas, verificación, finalidad, minimización y eliminación. |

## Entregables y reglas transversales

| Requisito | Estado y comprobación pendiente |
|---|---|
| H1 · Propuesta PDF, láminas, prototipo y mapa | Láminas, mapa y diagramas disponibles. Falta identificar la propuesta entregada y acreditar el prototipo y el estado del repositorio al cierre. |
| H2 · Código en rama principal, documento, tabla REST, base y colección | Hay código en GitHub, dos informes PDF distintos, contrato REST, modelo, SQL y colección. Falta confirmar el PDF evaluado y cotejar su tabla con el contrato. Los dos PDF revisados son A4 o equivalentes, frente al formato carta requerido por el Anexo A. |
| H3 · Producto en rama principal, PDF final, manual, video y anexos | Manuales disponibles en la consolidación local. Producto publicado y producto local requieren acreditaciones separadas. PDF final, video, declaración de IA y análisis de datos personales pendientes de confirmar. |
| Anexo A · Formato documental | Comprobar tapa, índice, estructura, carta, márgenes, tamaño de texto, numeración y APA 7 de cada versión entregada. La extracción de texto y las dimensiones solo acreditan una parte de la revisión. |
| Anexo B · Acceso, trazabilidad y archivos | GitHub es público según la auditoría previa. Falta confirmar acceso en los plazos, usuarios del equipo, revisión por PR, enlaces finales y ausencia de credenciales o datos personales en material publicable. |
| Anexos C y D · IA y privacidad | Registrar herramientas y verificación, cotejar fuentes y declarar el tratamiento real. Usar datos ficticios en la evaluación. Revisar los PDF que contienen identificadores personales antes de reutilizarlos como evidencia. |
| Anexo E · Integridad académica | Atribuir aportes reales y verificar referencias. Identificar las piezas reservadas al equipo. |
| Reglas de evaluación | Preservar la evidencia de entrega a tiempo, acceso docente y defensa. La revisión del expediente actual no acredita una presentación, asistencia ni una nota histórica. |
