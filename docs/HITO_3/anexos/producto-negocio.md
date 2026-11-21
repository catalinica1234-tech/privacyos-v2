# PRIVACYOS · producto y negocio

> **Estado del documento.** Propuesta de producto y modelo de negocio para Hito 3. Distingue explícitamente entre lo **implementado**, lo **probado**, lo **propuesto** y lo que **requiere autorización o desarrollo**. No hay clientes, ingresos ni tracción real que declarar.

## 1. Propuesta de valor

**PRIVACYOS convierte señales técnicas observables de un sitio web en hallazgos explicables para decidir qué revisar primero en privacidad.**

No vende cumplimiento legal automático ni “certificación”. Vende **claridad priorizada con evidencia**: qué se observó, dónde, cuándo y por qué importa. Esa honestidad es parte del producto, no una nota al pie.

### Problema

- Las políticas de privacidad son extensas y cambian; las tecnologías de terceros no siempre son visibles.
- Una pyme o un estudio jurídico no tiene tiempo ni herramientas para revisar cada sitio con método.
- Las plataformas enterprise son caras y complejas; una planilla no deja evidencia reproducible.
- Las herramientas que “puntúan” sin explicar generan falsa confianza.

### Solución

1. **Análisis acotado y real** de la página inicial: HTTPS, cabeceras, cookies, HTML limitado, `robots.txt`, tecnologías detectables y enlaces de transparencia.
2. **Score por dimensiones** (seguridad técnica, transparencia, terceros, gobernanza, retención) con evidencia y límites declarados.
3. **Informe legible** con hallazgos, recomendaciones y plan de acción priorizado.
4. **Asistente explicativo** server-side que responde sobre el informe, sin inventar datos y sin sustituir asesoría legal.
5. **Historial y comparación** para volver a medir y mostrar evolución.
6. **Accesibilidad como requisito**: teclado, lector de pantalla, alto contraste, lenguaje simple, dictado opcional.

### Lo que PRIVACYOS no es

- No es un escáner exhaustivo de todas las páginas, subdominios o flujos autenticados.
- No determina cumplimiento legal ni sustituye a un abogado.
- No asegura que un sitio sea “seguro” o “confiable”.
- No vende datos ni incorpora analytics de terceros en el navegador.

## 2. Segmentos

| Segmento | Dolor principal | Uso típico | Prioridad |
|---|---|---|---|
| Pymes digitales (e-commerce, servicios, educación) | No saben qué revisar ni cómo priorizar. | Diagnóstico periódico y plan de acción. | Alta |
| Consultoras de privacidad y estudios jurídicos | Necesitan evidencia reproducible para su trabajo. | Revisión previa, informes para clientes. | Alta |
| Profesionales independientes (DPO, cumplimiento) | Herramienta accesible para diagnósticos. | Análisis puntual y comparación. | Media |
| Organismos públicos y municipios | Transparencia y accesibilidad. | Diagnóstico y seguimiento. | Media (ciclo de venta largo) |
| Grandes empresas | Ya tienen plataformas y equipos. | No es el foco inicial. | Baja |

**Cliente ideal inicial:** pyme o consultora en Chile, con presencia web, sin equipo dedicado de privacidad, que necesita una primera foto defendible y un plan concreto. La referencia regulatoria es la **Ley 21.719** y el ecosistema de protección de datos; no se afirma cumplimiento automático.

## 3. Modelo de negocio

**SaaS B2B** con suscripción mensual y un **diagnóstico único** como puerta de entrada. Precios netos en UF; IVA aparte. Los planes son una **hipótesis comercial**, no una lista vigente: hoy el producto no tiene cuentas, facturación ni recuperación entre dispositivos.

| Plan | UF/mes | CLP/mes* | Para quién | Incluye (propuesta) |
|---|---:|---:|---|---|
| Esencial | 2,5 | 103.146 | Profesional independiente / pyme pequeña | 1 espacio, 10 análisis/mes, informes exportables |
| Profesional | 6,0 | 247.550 | Pyme con marketing/legal | 50 análisis/mes, asistente, comparación y priorización |
| Consultora | 15,0 | 618.874 | Consultora / estudio jurídico | Espacios por cliente, 250 análisis/mes, soporte prioritario |
| Diagnóstico único | 10,0 (pago único) | 412.583 | Organización que necesita una foto inicial | Informe técnico + sesión de 60 minutos |

\* UF 41.258,26 al 2026-11-02. El IVA (19 %) se suma al cobrar.

**Por qué estos precios:** están por debajo de una hora de consultoría senior y por encima de una herramienta genérica. El valor está en la evidencia y el informe, no en el volumen de escaneos. El plan Consultora monetiza la necesidad de separar clientes; el diagnóstico único reduce la barrera de entrada.

**Unit economics de planificación:** ARPU ponderado 5,6 UF/mes ≈ CLP 231.046; margen bruto año 3 ≈ 87,7 %; CAC de referencia CLP 250.000; CAC implícito base ≈ CLP 198.919. Son supuestos del modelo, no resultados. Ver [`../business/supuestos-modelo.md`](../../business/supuestos-modelo.md).

## 4. Go-to-market

### Canales

1. **Contenido y educación:** guías breves sobre Ley 21.719, cookies, terceros y accesibilidad; cada pieza termina en un diagnóstico gratuito acotado.
2. **Alianzas con estudios jurídicos y consultoras:** ellas aportan confianza y clientes; PRIVACYOS aporta evidencia y velocidad. Modelo de referidos o marca blanca a evaluar.
3. **Venta directa asistida:** para pymes y consultoras, con demo de 20 minutos y un informe real sobre el sitio del prospecto.
4. **LinkedIn y comunidades profesionales:** casos anonimizados, no testimonios inventados.
5. **Webinars y talleres:** “cómo leer un informe de privacidad sin ser técnico”.

### Embudo

`Contenido / referido → diagnóstico gratuito → informe → reunión → piloto pagado → suscripción`

Métricas por etapa: visita → diagnóstico iniciado → informe visto → contacto → piloto → conversión. No se declaran tasas porque no hay campañas reales.

### Primeros 90 días (propuesta)

| Semana | Acción | Salida verificable |
|---|---|---|
| 1–2 | Cerrar base de producción, migración y cuentas mínimas. | `/api/health` 200; CRUD aislado en producción. |
| 3–4 | 10 entrevistas con pymes y consultoras. | Hallazgos cualitativos, no “validación” estadística. |
| 5–6 | 3 diagnósticos gratuitos con informe real. | Evidencia de uso y fricción. |
| 7–8 | Ajustar copy, precios y alcance. | Propuesta comercial v1. |
| 9–12 | 2 pilotos pagados o cartas de intención. | Ingreso real o compromiso firmado. |

## 5. Competencia y diferenciación

| Alternativa | Fortaleza | Debilidad frente a PRIVACYOS |
|---|---|---|
| Revisión manual / planilla | Flexible, barata. | Lenta, sin evidencia reproducible, difícil de comparar. |
| Consultoría tradicional | Confianza y criterio legal. | Costo alto, poca frecuencia, entregable estático. |
| Plataformas enterprise de privacidad | Cobertura y workflows. | Precio y complejidad para pymes; implementación larga. |
| Escáneres gratuitos de cabeceras | Rápidos. | Sin contexto, sin informe, sin accesibilidad, sin priorización. |

**Diferenciación defendible (a construir, no declarada como lograda):**

- Evidencia trazable y explicable, no solo un score.
- Enfoque Chile/LatAm y lenguaje claro en español.
- Accesibilidad y lectura para personas mayores como ventaja, no como parche.
- Precio de entrada bajo y diagnóstico único.
- Asistente que explica el informe y reconoce lo que no sabe.

**Foso real:** la combinación de metodología, evidencia, confianza y distribución con consultoras. La tecnología sola es copiable; la reputación y los datos de uso bien tratados, no.

## 6. Métricas de producto y negocio

| Métrica | Definición | Meta inicial (hipótesis) |
|---|---|---|
| Activación | Primer análisis completado y visto. | ≥ 40 % de quienes inician |
| Profundidad | Análisis por espacio en 30 días. | ≥ 3 |
| Retención | Espacio activo al mes 3. | ≥ 60 % |
| Conversión a pago | Diagnóstico → plan. | ≥ 10 % |
| CAC | Costo de adquisición / clientes nuevos. | ≤ CLP 250.000 |
| LTV/CAC | Valor de vida / CAC. | ≥ 3 |
| Churn mensual | Bajas / activos. | ≤ 3,5 % |
| NPS | Recomendación. | ≥ 30 |
| Accesibilidad | Lighthouse accesibilidad en rutas clave. | 100 |
| Incidentes de seguridad | Incidentes confirmados con datos. | 0 |

**No hay valores reales de estas métricas.** Son objetivos de gestión para validar con pilotos.

## 7. Riesgos comerciales y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Base de producción caída | No hay demo ni clientes. | Restaurar Supabase o proveer nueva `DATABASE_URL`; bloquear lanzamiento hasta entonces. |
| Sin cuentas ni recuperación | El workspace se pierde al borrar la cookie. | Cuentas mínimas, verificación de correo, recuperación; prioridad 1 post-demo. |
| Sin facturación | No se puede cobrar. | Integrar pasarela y facturación; validar precios con pilotos. |
| Falsa expectativa legal | Riesgo reputacional y regulatorio. | Disclaimers, revisión legal, no prometer cumplimiento. |
| CAC mayor al supuesto | El modelo conservador ya destruye valor. | Medir CAC temprano; recortar canales malos. |
| Dependencia de Gemini/red | Asistente o motor degradados. | Feature flag, timeouts, fallback sin asistente; el informe sigue. |
| Competencia de consultoras | Canibalización. | Partnership, no confrontación; marca blanca. |
| Accesibilidad incompleta | Exclusión y riesgo reputacional. | Auditoría con axe/Playwright y prueba con usuarios. |

## 8. Estado real del producto (sin marketing)

| Capacidad | Estado |
|---|---|
| Motor de análisis real con evidencia | Implementado y probado en runtime. |
| Persistencia PostgreSQL/Prisma | Implementada; probada en PostgreSQL local. Producción pendiente por base caída. |
| Aislamiento por espacio anónimo (`ownerHash`) | Implementado y probado con dos espacios. |
| Asistente IA server-side | Implementado y probado con Gemini real; flag `ASSISTANT_ENABLED`. |
| Historial, informe, comparación, ajustes | Implementado; revisión manual y Lighthouse. |
| Accesibilidad WCAG 2.2 AA | Mejoras sustanciales; **no** se declara conformidad plena. |
| Cuentas, login, recuperación | **No implementado**. El espacio vive en una cookie HttpOnly. |
| Facturación y planes | **No implementado**. Precios son hipótesis. |
| Exportación PDF del informe | **No verificada** como flujo de servidor; el navegador puede imprimir. |
| Analítica de producto | **No implementada** (decisión de privacidad). |
| Producción operativa | **No**: base Supabase inaccesible. |

## 9. Roadmap priorizado

**Ahora (bloqueante):** restaurar base de producción, aplicar migración con autorización, verificar CRUD/aislamiento, configurar backups y monitoreo.

**Siguiente (90 días):** cuentas mínimas con recuperación, facturación, exportación PDF, Redis para rate limit, E2E Playwright + axe, pruebas con usuarios, revisión legal.

**Después (6–12 meses):** espacios de equipo, roles, programación de análisis, comparación histórica, API pública, integraciones, planes Consultora con marca blanca, expansión LatAm.

## 10. Conclusión

PRIVACYOS tiene una tesis defendible: **evidencia explicable + accesibilidad + precio de entrada bajo** para un mercado que hoy resuelve privacidad con planillas o consultoría caras. Lo que falta no es una historia: es ejecución comercial y cerrar la brecha entre demo local y producto operativo. El modelo financiero base es atractivo, pero el conservador muestra que sin ejecución sostenida el negocio no se sostiene. Esa tensión se declara, no se esconde.
