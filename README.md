# PRIVACYOS — Inteligencia para la privacidad digital

**Propuesta de valor:** PRIVACYOS transforma señales técnicas observables de privacidad web en hallazgos explicables y prioridades de revisión. Ayuda a los equipos a entender qué se observó, por qué puede importar y qué conviene revisar primero. Es una herramienta de apoyo y no sustituye una auditoría profesional ni certifica cumplimiento legal.

## Producto y demostración

- **Aplicación web:** https://privacyos-v2.vercel.app/
- **Dashboard:** https://privacyos-v2.vercel.app/app/dashboard
- **Nuevo análisis:** https://privacyos-v2.vercel.app/app/nuevo
- **Repositorio:** https://github.com/catalinica1234-tech/privacyos-v2

La aplicación permite realizar una revisión acotada de un sitio web público y presentar hallazgos asociados a señales técnicas observadas. El recorrido principal es **Dashboard → Nuevo análisis → Progreso → Informe**. El historial y las preferencias se guardan localmente en el navegador.

## Entregables académicos

Todos los documentos se encuentran en [`docs/`](docs/).

| Entregable | Archivo |
|---|---|
| Láminas para entregar y proyectar | [Presentación PDF](docs/PRIVACYOS_Presentacion.pdf) |
| Presentación interactiva con demo integrada | [Presentación HTML](docs/PRIVACYOS_Presentacion.html) |
| Prototipo navegable | [Abrir aplicación desplegada](https://privacyos-v2.vercel.app/app/dashboard) |
| Mapa del producto y rutas de navegación | [mapa-producto.svg](docs/mapa-producto.svg) |
| Arquitectura cliente-servidor y capas | [diagrama-arquitectura.svg](docs/diagrama-arquitectura.svg) |
| Guion completo de exposición | [guion-exposicion.md](docs/guion-exposicion.md) |
| Carta Gantt | [carta-gantt.html](docs/carta-gantt.html) |
| Auditoría de criterios | [auditoria-hito1.md](docs/auditoria-hito1.md) |
| Checklist de cierre | [CHECKLIST_CIERRE_HITO1.md](docs/CHECKLIST_CIERRE_HITO1.md) |
| Cambios pendientes del informe | [CAMBIOS_PENDIENTES_INFORME.md](docs/CAMBIOS_PENDIENTES_INFORME.md) |

> **Informe de propuesta:** queda deliberadamente fuera del repositorio hasta que su autora termine la edición y verifique las citas, referencias, figuras y extensión. No se debe subir ningún PDF de informe previo como definitivo.

## Equipo

- **Catalina Romero** — [@catalinica1234-tech](https://github.com/catalinica1234-tech): frontend, integración y revisión.
- **Melisa Ibáñez** — [@melisaibanezdelgado-eng](https://github.com/melisaibanezdelgado-eng): investigación, documentación y propuesta.
- **Simón Salgado** — [@simonsalgadousa-ux](https://github.com/simonsalgadousa-ux): arquitectura y presentación.

## Arquitectura y tecnologías

PRIVACYOS utiliza Next.js con App Router, React, TypeScript, Tailwind CSS y Zod. El endpoint `POST /api/analyze` valida la entrada, aplica comprobaciones de seguridad para reducir riesgos SSRF y ejecuta un análisis limitado de señales técnicas del sitio público. Los hallazgos se generan a partir de evidencia observada; la persistencia de historial y preferencias es local al navegador.

## Alcance y transparencia

- El análisis se limita a señales observables y a la respuesta inicial consultada; no realiza crawling exhaustivo.
- Las relaciones con marcos normativos son orientativas y no constituyen un dictamen legal ni una certificación de cumplimiento.
- No se afirma que exista autenticación multiusuario, persistencia compartida en una base de datos o monitorización continua.
- La aplicación es web responsive; no se presenta como aplicación nativa para iOS o Android.
- Las funcionalidades no implementadas se consideran trabajo futuro, no capacidades disponibles.

## Cómo navegar la presentación

Abre `docs/PRIVACYOS_Presentacion.html` en un navegador moderno. Usa los botones de navegación o las flechas izquierda/derecha; la tecla `F` activa pantalla completa. La diapositiva de demostración integra la aplicación y ofrece enlaces directos por si el navegador bloquea la incrustación.
