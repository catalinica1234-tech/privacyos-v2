# PRIVACYOS — Guion de pitch y demostración

**Duración objetivo:** 4:45–5:00 minutos.  
**Orden:** Simón → Melisa → Catalina → Simón → Melisa.  
**Idea central:** PRIVACYOS transforma señales técnicas observables en hallazgos explicables y prioridades de revisión.

## Preparación
Antes de exponer, abrir el HTML y comprobar el despliegue. Dejar preparado el dashboard y una URL pública de prueba. Si el navegador bloquea la demo integrada, abrir el producto en una pestaña aparte. No usar una URL sensible ni un sitio sin autorización.

## Diapositiva 1 — Portada | Simón | 0:00–0:20
“Hola, somos el equipo de PRIVACYOS. Hoy queremos mostrar una idea simple: cuando hablamos de privacidad digital, muchas veces tenemos declaraciones, documentos y señales técnicas por separado, pero cuesta convertirlas en una decisión concreta. PRIVACYOS busca reducir esa distancia y ayudar a entender qué señales se observan y qué conviene revisar primero.”

## Diapositiva 2 — El problema | Simón | 0:20–0:50
“Los equipos que gestionan servicios digitales necesitan revisar cómo se comportan sus sitios y qué señales técnicas pueden ser relevantes para la privacidad. El desafío no es solo encontrar información, sino entenderla, priorizarla y convertirla en acciones. Por eso el producto se centra en evidencia observable y explicaciones, no en promesas absolutas.”

## Diapositiva 3 — Propuesta de valor | Melisa | 0:50–1:20
“PRIVACYOS está pensado para equipos de producto, tecnología y privacidad que necesitan una primera revisión organizada. Reúne señales técnicas, hallazgos y recomendaciones en un mismo flujo. Su valor es ahorrar trabajo de exploración inicial y facilitar una conversación informada sobre qué revisar, sin reemplazar la evaluación especializada.”

## Diapositiva 4 — Cómo se usa | Catalina | 1:20–1:40
“El recorrido es directo: partimos en el dashboard, iniciamos un análisis, observamos su progreso y llegamos a un informe organizado. Ahora les mostraré ese flujo en el producto.”

## Diapositiva 5 — Demo en vivo | Catalina | 1:40–2:50
“Desde el dashboard entramos a Nuevo análisis. Ingresamos una URL pública y ejecutamos la revisión. El sistema aplica validaciones de seguridad antes de consultar el sitio. Luego muestra los resultados disponibles en un informe. Aquí lo importante es que los hallazgos se relacionan con señales observadas; no son una certificación legal ni una garantía de que se detectó todo.”

**Acciones durante la demo**
1. Mostrar Dashboard.
2. Abrir Nuevo análisis.
3. Ingresar una URL pública preparada y ejecutar el análisis.
4. Abrir el informe resultante y mostrar un hallazgo con su evidencia.
5. Si falla la red, abrir el informe de respaldo preparado previamente.

## Diapositiva 6 — Arquitectura | Simón | 2:50–3:25
“En la arquitectura, el navegador presenta la interfaz y envía la solicitud al endpoint de análisis. En el servidor se validan los datos y se aplican controles para reducir riesgos como SSRF. El motor consulta señales limitadas del sitio y genera hallazgos a partir de evidencia. El historial y las preferencias se guardan localmente en el navegador.”

## Diapositiva 7 — Decisiones técnicas | Simón | 3:25–3:55
“Elegimos Next.js y React para construir una experiencia web integrada; TypeScript ayuda a mantener consistencia en el código; Zod valida los datos de entrada y salida; Tailwind facilita mantener un sistema visual coherente, y Vercel permite desplegar el producto. La arquitectura mantiene separadas la interfaz, la validación y la lógica de análisis.”

## Diapositiva 8 — Alcance y confianza | Melisa | 3:55–4:20
“Preferimos ser precisos con lo que ofrecemos. PRIVACYOS hace una revisión técnica acotada de un sitio público. No realiza un rastreo exhaustivo, no emite dictámenes legales y no asegura detectar todos los riesgos. Esta transparencia permite entender el valor real de la herramienta y evita confundir un apoyo inicial con una auditoría completa.”

## Diapositiva 9 — Equipo y trabajo futuro | Melisa | 4:20–4:40
“El trabajo se organiza entre frontend e integración, investigación y documentación, y arquitectura y presentación. Como trabajo futuro, se pueden evaluar nuevas fuentes de evidencia, persistencia compartida y funciones de seguimiento, siempre validando su necesidad y viabilidad.”

## Diapositiva 10 — Cierre | Melisa | 4:40–5:00
“PRIVACYOS convierte señales técnicas en una base más clara para decidir qué revisar. No pretende sustituir a las personas expertas: busca ayudarles a empezar mejor, con evidencia organizada, prioridades comprensibles y un flujo que conecta el análisis con la acción. Muchas gracias.”

## Preguntas probables
**¿PRIVACYOS certifica cumplimiento legal?**  
“No. Presenta señales técnicas y relaciones normativas orientativas. No sustituye una auditoría ni un dictamen legal.”

**¿Analiza todo el sitio?**  
“No. El análisis es acotado y se centra en señales observables de la respuesta consultada. No es crawling exhaustivo.”

**¿Dónde se guardan los datos?**  
“El historial y las preferencias se guardan localmente en el navegador; no afirmamos que exista persistencia multiusuario compartida.”

**¿Por qué Next.js?**  
“Permite integrar rutas, interfaz y endpoints en una arquitectura web única, con herramientas maduras para desplegar y mantener el producto.”

**¿Qué diferencia a PRIVACYOS?**  
“Organiza señales técnicas, evidencias y prioridades de revisión en un mismo flujo, con límites explícitos sobre lo que puede concluir.”
