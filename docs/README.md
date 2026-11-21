# Documentación PRIVACYOS · Hito 2 y Hito 3

Esta carpeta reúne la evidencia de auditoría, arquitectura, seguridad, accesibilidad, pruebas, negocio y cierre del proyecto **PRIVACYOS V2 / Serenidad** (INGT1003).

> **Regla de honestidad:** todo estado se declara como Implementado, Probado, Desplegado, Documentado, Pendiente, Pendiente de autorización o No verificable. Ningún dato de negocio, certificación o resultado de cliente se presenta como real si no lo es.

## Índice

| Documento | Para qué sirve |
|---|---|
| [audit/auditoria-forense.md](audit/auditoria-forense.md) | Hallazgos de la auditoría inicial, correcciones y riesgos residuales. |
| [architecture/arquitectura.md](architecture/arquitectura.md) | Contexto, capas, modelo de datos, flujos y decisiones. |
| [security/seguridad.md](security/seguridad.md) | Modelo de amenazas, SSRF, OWASP, secretos, privacidad y Ley 21.719. |
| [accessibility/accesibilidad.md](accessibility/accesibilidad.md) | Correspondencia WCAG 2.2 AA, ayudas implementadas y pruebas manuales. |
| [testing/pruebas.md](testing/pruebas.md) | Estrategia, suites, resultados y límites de verificación. |
| [deployment/despliegue.md](deployment/despliegue.md) | Variables, migraciones, health check, rollback y estado de producción. |
| [hito-2/matriz-cumplimiento.md](hito-2/matriz-cumplimiento.md) | Autoevaluación requisito por requisito (sin rúbrica oficial disponible). |
| [hito-2/gantt-analisis.md](hito-2/gantt-analisis.md) | Planificación, camino crítico, desviaciones y aprendizaje. |
| [hito-3/producto-negocio.md](hito-3/producto-negocio.md) | Propuesta de valor, segmentos, precios, go-to-market y métricas. |
| [business/modelo-financiero.xlsx](business/modelo-financiero.xlsx) | Modelo con fórmulas, escenarios, P&L, VAN/TIR y sensibilidad. |
| [business/supuestos-modelo.md](business/supuestos-modelo.md) | Supuestos, fuentes y cómo leer el modelo. |
| [video/guion-video-2min.md](video/guion-video-2min.md) | Guion cronometrado de la demo de 2 minutos. |
| [defense/60-preguntas.md](defense/60-preguntas.md) | Preparación de defensa con respuestas breves y límites. |
| [cierre/informe-final-26-preguntas.md](cierre/informe-final-26-preguntas.md) | Cierre ejecutivo con estados y pendientes de autorización. |
| [evidence/indice-evidencias.md](evidence/indice-evidencias.md) | Comandos, salidas, capturas y trazabilidad de lo probado. |

## Estado global resumido

| Área | Estado |
|---|---|
| Motor real + evidencia | Implementado y probado en runtime. |
| Asistente IA server-side | Implementado y probado con Gemini real. |
| Persistencia PostgreSQL/Prisma | Implementada; **probada en PostgreSQL local**; producción pendiente de restaurar la base. |
| Aislamiento por espacio anónimo | Implementado; probado con base local en dos espacios distintos. |
| Accesibilidad WCAG 2.2 AA | Ayudas implementadas; **Lighthouse 100** en Home y Dashboard. Falta axe/E2E y prueba con lector de pantalla. No se declara certificación. |
| Seguridad SSRF/CSRF/límites | Implementada y probada con 8 payloads hostiles. |
| Pruebas unitarias | 77/77 en verde (Vitest), cobertura de módulos críticos ≥ 80 % statements. E2E/axe pendiente. |
| Despliegue de estos cambios | **No realizado**: requiere autorización y una base funcional. |
| Rúbrica oficial Hito 2/Hito 3 | **No verificable**: no estaba disponible en el entorno. |
