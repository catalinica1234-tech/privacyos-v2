# PRIVACYOS — Cambios pendientes para el informe

> **Regla editorial:** PRIVACYOS se presenta como un único producto. No incluir una historia de versiones ni expresiones como “versión anterior”, “versión posterior” o “reconstrucción desde cero”. Describe el producto entregado y su alcance real.

## Instrucciones
Editar manualmente el informe original. No reescribirlo completo ni modificar el archivo original automáticamente. Mantener la estructura y la redacción que ya estén correctas.

## Revisiones necesarias
1. **Propuesta de valor:** explicar el problema, el público objetivo, el beneficio y la diferencia de PRIVACYOS con afirmaciones respaldadas.
2. **Evidencia del problema:** verificar cada cifra y afirmación con una fuente identificable y una cita en el texto. No extrapolar estudios de aplicaciones móviles a todos los sitios web.
3. **Citas y bibliografía APA:** comprobar correspondencia entre citas y referencias, y verificar autores, año, título y DOI/URL.
4. **Mapa del producto:** incorporar `docs/mapa-producto.svg` como figura numerada, con título y fuente; explicar la jerarquía y el flujo Dashboard → Nuevo análisis → Progreso → Informe.
5. **Arquitectura:** incorporar `docs/diagrama-arquitectura.svg` como figura numerada y explicar cliente, endpoint `POST /api/analyze`, validaciones de seguridad, motor de análisis y servicio externo.
6. **Tecnologías:** justificar Next.js, React, TypeScript, Tailwind, Zod y Vercel con criterios concretos. Explicar la arquitectura web con precisión, sin llamarla “SPA pura” sin justificación.
7. **Web y móvil:** describir el producto como aplicación web responsive, salvo que exista una aplicación nativa demostrable.
8. **Alcance técnico:** indicar que el análisis revisa señales técnicas acotadas; no afirmar crawling exhaustivo, detección de todos los riesgos, certificación legal, autenticación multiusuario, base de datos compartida o monitorización continua si no están implementadas.
9. **Prototipo:** demostrar al menos tres pantallas conectadas mediante clics, con capturas propias, rutas reproducibles y enlace verificado al despliegue.
10. **Equipo:** verificar nombres, responsabilidades y cantidad de integrantes con los antecedentes oficiales y la docente; no inventar integrantes.
11. **Formato:** comprobar portada, índice, introducción, desarrollo paginado, conclusión, bibliografía y anexos. Máximo 25 páginas sin contar anexos.

## Lista final
- [ ] Se presenta un único producto: PRIVACYOS.
- [ ] Cada capacidad declarada como existente se puede demostrar.
- [ ] Las capacidades pendientes se identifican como trabajo futuro.
- [ ] Las figuras están numeradas y descritas.
- [ ] Citas y referencias APA coinciden.
- [ ] Índice, paginación y figuras están actualizados.
- [ ] PDF legible y máximo de 25 páginas sin anexos.
- [ ] El informe se incorpora al repositorio solo después de la edición final de su autora.
