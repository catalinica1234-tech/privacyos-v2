# Accesibilidad

**Referencia:** WCAG 2.2 nivel AA. **No se declara certificación ni conformidad plena**: se documenta lo implementado, lo probado y lo que falta. La accesibilidad es un proceso, no un sello.

## 1. Principios de diseño

- **Legibilidad para adultos mayores:** base de 15 px, interlineado 1.6, textos secundarios de 12–13.5 px, contraste reforzado opcional, jerarquía clara de títulos y párrafos cortos.
- **Uso con lector de pantalla:** landmarks (`header`, `nav`, `main`), skip link, etiquetas explícitas, `aria-current`, `aria-live` para estados y nombres accesibles en iconos.
- **Uso con teclado:** orden lógico, foco visible, tabs con flechas/Home/End, modal con foco atrapado y Escape, restauración de foco.
- **Baja visión:** modo oscuro, alto contraste, texto escalable, componentes que no dependen solo del color (se añaden texto/iconos).
- **Discapacidad motriz:** objetivos ≥ 24×24 px, botones grandes, sin gestos obligatorios, dictado por voz opcional.
- **Cognitiva:** lenguaje simple, pasos numerados, errores con sugerencia, estados de carga y confirmación antes de borrar.
- **Sordera:** todo el contenido es textual; no hay audio obligatorio. El dictado es opcional y produce texto.

## 2. Correspondencia con WCAG 2.2 AA

| Criterio | Implementación | Estado |
|---|---|---|
| 1.1.1 Contenido no textual | Iconos decorativos `aria-hidden`; iconos con significado acompañados de texto o `aria-label`. | Implementado, revisión manual parcial. |
| 1.3.1 Información y relaciones | Encabezados jerárquicos, listas, `table` en comparación, `fieldset`/`role=group` en marcos, `tablist`/`tab`/`tabpanel`. | Implementado. |
| 1.3.2 Secuencia significativa | DOM en orden de lectura; navegación antes de contenido. | Implementado. |
| 1.3.4 Orientación | Sin bloqueo de orientación. | Implementado. |
| 1.3.5 Identificar el propósito | `autocomplete` en URL/perfil; labels visibles. | Implementado. |
| 1.4.1 Uso del color | Severidad/estado con texto además de color. | Implementado. |
| 1.4.3 Contraste mínimo | Paleta Serenidad ajustada; alto contraste opcional. | **Medido en Home/Dashboard**: Lighthouse 100; falta axe en todas las rutas. |
| 1.4.4 Redimensionar texto | Unidades relativas; layout flexible. | Probado a 200 % en navegador (parcial). |
| 1.4.10 Reflow | Grid/flex responsive; tablas con scroll. | Probado a 320 px (parcial). |
| 1.4.11 Contraste no textual | Bordes y foco con variables; alto contraste. | Parcial. |
| 1.4.12 Espaciado de texto | Sin alturas fijas en párrafos. | Implementado. |
| 1.4.13 Contenido en hover/focus | Sin tooltips dependientes de hover. | Implementado. |
| 2.1.1 Teclado | Todos los controles son botones/enlaces/inputs nativos. | Implementado. |
| 2.1.2 Sin trampas de teclado | Modal atrapa el foco a propósito y se cierra con Escape. | Implementado. |
| 2.2.1 Tiempo ajustable | Sin límites de tiempo en la UI; el análisis tiene deadline de servidor y se informa. | Implementado. |
| 2.3.1 Sin destellos | Sin animaciones de destello; `prefers-reduced-motion` desactiva transiciones. | Implementado. |
| 2.4.1 Evitar bloques | Skip link “Saltar al contenido principal”. | Implementado. |
| 2.4.2 Título de página | Metadata por ruta (`%s · PRIVACYOS`). | Implementado. |
| 2.4.3 Orden del foco | Orden DOM; foco gestionado en tabs/modal. | Implementado. |
| 2.4.4 Propósito de enlaces | Texto descriptivo; enlaces externos con icono y `rel`. | Implementado. |
| 2.4.6 Encabezados y etiquetas | H1 por página; labels en formularios; `aria-label` en filtros. | Implementado. |
| 2.4.7 Foco visible | `:focus-visible` con outline de 2 px y offset. | Implementado. |
| 2.4.11 Foco no oscurecido | `scroll-mt-24` en tarjetas de hallazgo; sin header fijo que tape. | Implementado. |
| 2.5.1 Gestos de puntero | Sin gestos multipunto ni trazados. | Implementado. |
| 2.5.7 Movimientos de arrastre | No hay drag obligatorio. | Implementado. |
| 2.5.8 Tamaño del objetivo | Botones `btn-sm` ≥ 32 px de alto; iconos con padding. | **Parcial**: revisar objetivos de 24 px en chips pequeños. |
| 3.1.1 Idioma | `<html lang="es">`. | Implementado. |
| 3.2.1 Al recibir foco | Sin cambios de contexto al enfocar. | Implementado. |
| 3.2.2 Al introducir datos | Sin envíos automáticos salvo dictado (decisión explícita del usuario). | Implementado. |
| 3.3.1 Identificación de errores | Errores de URL con texto y `aria-invalid`/`aria-describedby`; alertas. | Implementado. |
| 3.3.2 Etiquetas o instrucciones | Labels visibles y ayudas; límite de 600 caracteres. | Implementado. |
| 3.3.3 Sugerencia de error | Mensajes con ejemplo y acción (“Corregir la URL”, “Reintentar”). | Implementado. |
| 3.3.7 Entrada redundante | El contexto del análisis se conserva hasta completar; no se pide dos veces. | Implementado. |
| 4.1.2 Nombre, rol, valor | Roles ARIA en tabs, modal, meter, alert, log; `aria-pressed`/`aria-expanded`. | Implementado. |
| 4.1.3 Mensajes de estado | `role=status`/`aria-live` en progreso, filtros, asistente, guardado y borrado. | Implementado. |

## 3. Ayudas concretas implementadas

1. **Skip link** visible al foco y `main#contenido-principal`.
2. **Alto contraste** conmutable en Configuración; se aplica antes del paint con script inline y variables CSS.
3. **Tema claro/oscuro/sistema** sin parpadeo.
4. **Tabs accesibles:** roving tabindex, flechas izquierda/derecha, Home/End, `aria-selected`, `aria-controls`, paneles con `aria-labelledby`.
5. **Modal accesible:** `role=dialog`, `aria-modal`, foco inicial, Tab/Shift+Tab atrapados, Escape, restauración de foco y bloqueo de scroll.
6. **Progreso:** lista de etapas con `aria-current="step"`, estado live y errores con `role=alert`.
7. **Informe:** “Ver hallazgo” cambia de pestaña, abre la tarjeta, hace scroll y enfoca el artículo.
8. **Asistente:** label visible, log con `aria-live`, errores con reintento, dictado opcional con `aria-pressed`, conversación conservada.
9. **Formulario de análisis:** validación en vivo, `aria-invalid`, `aria-describedby`, botón deshabilitado con explicación.
10. **Preferencias:** botones con `aria-pressed`, feedback con `role=status`.
11. **Movimiento reducido:** `@media (prefers-reduced-motion: reduce)` desactiva animaciones/transiciones.
12. **Sin terceros en el navegador:** fuentes autoalojadas; no hay Google Fonts ni analytics.

## 4. Pruebas realizadas

| Prueba | Método | Resultado |
|---|---|---|
| Navegación por teclado en tabs | Manual + inspección de código | Flechas/Home/End y foco funcionan. |
| Focus trap del modal | Manual + código | Tab cicla, Escape cierra, foco vuelve. |
| Lectura de estados | Inspección de `aria-live`/roles | Progreso, errores y conversación anunciados. |
| Zoom 200 % / 320 px | Navegador (por completar en todas las rutas) | Sin desbordes graves en las rutas revisadas. |
| Contraste | Variables + alto contraste + Lighthouse | Home y Dashboard sin fallos de contraste en Lighthouse. |
| Lighthouse | Build de producción local (`next start`) | Home 80/100/100/100; Dashboard 81/100/100/100 (performance/accesibilidad/best-practices/SEO). |
| Lector de pantalla | NVDA/VoiceOver | **No verificable en este entorno**; requiere prueba humana. |

### Correcciones de accesibilidad verificadas con Lighthouse

1. **Contraste:** los tonos de riesgo se oscurecieron (`#176b45`, `#83530f`, `#9a3f12`) para superar 4.5:1 sobre sus fondos suaves.
2. **Nombre accesible de la marca:** se quitaron `aria-label` que no coincidían con el texto visible; el icono “P” es decorativo (`aria-hidden`).
3. **Jerarquía de encabezados:** `EmptyState` pasó de `h3` a `h2` para no saltar de `h1` a `h3`.
4. **Favicon:** se añadió `app/icon.svg`; desapareció el 404 de `/favicon.ico`.

Los reportes completos están en [`../evidence/lighthouse-home-final.report.html`](../evidence/lighthouse-home-final.report.html) y [`../evidence/lighthouse-dashboard-final.report.html`](../evidence/lighthouse-dashboard-final.report.html).

## 5. Guion de prueba manual (10 minutos)

1. Entrar a `/` y pulsar Tab: el primer foco debe ser “Saltar al contenido principal”.
2. Activar el skip link: el foco debe ir al `main`.
3. Ir a `/app/nuevo`, escribir una URL inválida: debe aparecer error asociado y `aria-invalid`.
4. Corregir la URL, iniciar análisis y observar el estado “Etapa X de 7” en el lector.
5. En el informe, navegar tabs con flechas; comprobar que el panel cambia y el foco queda en la pestaña.
6. Ir a “Plan de acción”, activar “Ver hallazgo”: debe cambiar a Hallazgos, abrir y enfocar la tarjeta.
7. Abrir el asistente, cerrarlo y reabrirlo: la conversación debe conservarse.
8. En Configuración, activar alto contraste; recargar: debe persistir.
9. Abrir el modal de borrado; Tab no debe salir del diálogo; Escape debe cerrar sin borrar.
10. Reducir el ancho a 320 px y hacer zoom 200 %: no debe haber scroll horizontal global.

## 6. Brechas y plan

| Brecha | Impacto | Plan |
|---|---|---|
| Sin auditoría con axe/Playwright en CI | Regresiones no detectadas. | Añadir `@axe-core/playwright` y pruebas por ruta. |
| Sin prueba con lector de pantalla real | Puede haber nombres/roles mejorables. | Sesión con persona usuaria de NVDA/VoiceOver. |
| Contraste no medido en todas las combinaciones | Riesgo 1.4.3/1.4.11. | Medir con axe y ajustar tokens. |
| Objetivos pequeños en chips | Riesgo 2.5.8. | Aumentar padding mínimo a 24×24 px. |
| Sin intérprete de lengua de señas ni audio | No es requisito AA, pero limita a personas sordas que prefieren LSCh. | Evaluar videos con subtítulos/LSCh en Hito 3. |
| Lenguaje técnico en hallazgos | Barrera cognitiva. | Glosario y modo “palabras simples” (el asistente ya ayuda). |

## 7. Declaración

La interfaz incorpora ayudas sustanciales para adultos mayores y personas con discapacidad visual, motriz, auditiva o cognitiva, y sigue la estructura de WCAG 2.2 AA. **No se afirma conformidad total** hasta completar auditoría automatizada, pruebas con tecnología de asistencia y revisión de contenido. La accesibilidad se prioriza como requisito de producto, no como adorno.
