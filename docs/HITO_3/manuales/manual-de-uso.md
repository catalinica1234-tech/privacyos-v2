# Manual de uso de PRIVACYOS

> Guía para utilizar la aplicación web, ejecutar un análisis de prueba, interpretar sus resultados y resolver los problemas más comunes.

**Proyecto:** PRIVACYOS — The intelligence layer for digital privacy  
**Asignatura:** INGT Proyecto Semestral — Universidad Mayor  
**Aplicación:** [https://privacyos-v2.vercel.app/](https://privacyos-v2.vercel.app/)

---

## 1. ¿Qué es PRIVACYOS?

PRIVACYOS es una plataforma de análisis de privacidad digital. Permite iniciar análisis sobre sitios web públicos, consultar los resultados obtenidos y revisar hallazgos, evidencias y recomendaciones desde un informe.

La plataforma también incorpora un asistente inteligente para apoyar la comprensión de conceptos y observaciones relacionadas con privacidad, cuando el servicio se encuentra habilitado.

### ¿Qué puedes hacer?

- Iniciar un análisis indicando la dirección de un sitio web público.
- Seleccionar los marcos de análisis disponibles en la interfaz.
- Consultar el informe generado.
- Revisar hallazgos y evidencias.
- Volver a consultar análisis guardados desde el historial.
- Utilizar el asistente para aclarar conceptos y comprender observaciones, si está disponible.

**Importante:** PRIVACYOS entrega señales y orientación para apoyar una revisión. Sus resultados no constituyen por sí solos una certificación, auditoría legal, garantía de cumplimiento normativo ni evaluación exhaustiva de todas las prácticas internas de un servicio.

---

## 2. Antes de comenzar

Para una experiencia correcta, considera lo siguiente:

1. Utiliza una versión actualizada de Chrome, Edge, Firefox o un navegador moderno equivalente.
2. Mantén habilitadas las cookies del sitio, ya que el espacio de trabajo utiliza una cookie del navegador.
3. Comprueba que tienes conexión a Internet.
4. Utiliza una URL pública que pueda abrirse desde Internet.
5. Para demostraciones académicas, utiliza sitios y datos de prueba. No ingreses contraseñas, datos personales, información privada ni direcciones internas.

### Acceso a la plataforma

1. Abre el enlace: [Ingresar a PRIVACYOS](https://privacyos-v2.vercel.app/).
2. Espera a que cargue el panel.
3. Si no carga, actualiza la página una vez y comprueba tu conexión.
4. Utiliza el mismo navegador y perfil cuando quieras volver a consultar tus análisis anteriores.

---

## 3. Realizar un nuevo análisis

### Paso 1. Abrir la opción de análisis

Desde el panel, selecciona **Nuevo análisis**.

### Paso 2. Ingresar el sitio web

En el campo de URL, escribe la dirección pública del sitio que deseas revisar.

Ejemplo de URL de prueba:

`https://example.com`

Recomendaciones:
- Incluye el protocolo `https://` o `http://`.
- Revisa que la dirección esté escrita correctamente.
- Utiliza un sitio público y accesible.
- No utilices enlaces privados, intranets ni páginas que requieran credenciales.

### Paso 3. Seleccionar los marcos disponibles

Selecciona los marcos de análisis que aparecen en la interfaz y que correspondan al objetivo de la prueba.

La disponibilidad de opciones puede depender de la configuración de la aplicación. Selecciona únicamente las opciones que se muestran en pantalla.

### Paso 4. Iniciar y esperar el resultado

Confirma el inicio del análisis y espera la respuesta del sistema. Evita cerrar la pestaña mientras se procesa la solicitud.

Si aparece un estado de carga, permite que el proceso termine. Si ocurre un error de conexión o guardado, revisa la sección [Solución de problemas](#10-solución-de-problemas).

---

## 4. Consultar e interpretar el informe

Cuando el análisis se haya guardado, abre el informe correspondiente.

### Hallazgos

En esta sección puedes revisar las observaciones que el análisis identificó en el sitio evaluado.

Al leer un hallazgo:
1. Identifica qué comportamiento o señal describe.
2. Lee su explicación y contexto.
3. Revisa si se indica un nivel o prioridad.
4. Evita interpretar una observación aislada como prueba definitiva de incumplimiento.

### Evidencias

Las evidencias permiten contextualizar los hallazgos y comprender qué información respalda una observación.

Para revisar una evidencia:
1. Abre la sección **Evidencias**.
2. Lee el contenido disponible.
3. Relaciona la evidencia con el hallazgo correspondiente.
4. Distingue entre lo que la evidencia muestra y la interpretación que se presenta.

### Recomendaciones

Si el informe presenta recomendaciones, utilízalas como orientación para decidir qué revisar primero. Una recomendación no significa que el cambio ya se haya aplicado en el sitio analizado.

**Criterio de interpretación:** diferencia siempre entre evidencia observada, explicación del sistema y recomendación. No atribuyas al análisis información que no aparezca en el informe.

---

## 5. Consultar el historial

La opción **Historial** permite volver a localizar análisis guardados.

1. Regresa al panel.
2. Abre **Historial**.
3. Localiza el análisis que quieres revisar.
4. Selecciónalo para abrir nuevamente el informe.
5. Si necesitas comprobar que el resultado sigue disponible, recarga la página.

La consulta de los análisis depende del espacio de trabajo asociado a la cookie del navegador. Si cambias de navegador, perfil o eliminas las cookies, podrías no encontrar el mismo historial.

---

## 6. Utilizar el asistente inteligente

PRIVACYOS incluye un asistente que puede ayudar a comprender conceptos de privacidad y observaciones de un informe, cuando está habilitado y disponible.

### Consultas generales

Desde el panel puedes preguntar por conceptos como:
- ¿Qué son las cookies?
- ¿Qué significa el consentimiento?
- ¿Por qué es importante revisar las prácticas de privacidad de un sitio?

### Consultas sobre un informe

Cuando estés dentro de un informe guardado, puedes pedir al asistente que explique una observación o te ayude a comprender qué revisar primero.

Para obtener respuestas más útiles:
1. Mantén abierto el informe que quieres consultar.
2. Formula una pregunta concreta.
3. Menciona el hallazgo o concepto al que te refieres.
4. Contrasta la explicación con las secciones **Hallazgos** y **Evidencias**.

El asistente puede no estar disponible temporalmente por configuración, conectividad o límites del servicio. Si no responde, puedes continuar revisando el informe sin él.

---

## 7. Buenas prácticas para una demostración

Para realizar una demostración ordenada:

1. Abre la aplicación antes de comenzar la presentación.
2. Utiliza una URL pública de prueba.
3. Explica brevemente qué sitio se analizará y qué se espera observar.
4. Inicia el análisis y espera el resultado.
5. Abre el informe y muestra al menos un hallazgo.
6. Explica la evidencia asociada sin exagerar lo que demuestra.
7. Si el asistente está disponible, realiza una pregunta breve relacionada con el informe.
8. Finaliza explicando cómo el historial permite volver a consultar el análisis.

### Recomendaciones para la evaluación académica

- Utiliza datos ficticios o información pública.
- No muestres credenciales, tokens, claves API ni información personal.
- No afirmes que el sistema certifica el cumplimiento de una normativa.
- Si una función no está disponible durante la demostración, explica la situación y continúa con las secciones que sí estén operativas.
- No presentes resultados de ejemplo como si fueran resultados reales de una ejecución.

---

## 8. Privacidad y uso responsable

- Analiza únicamente sitios públicos o aquellos para los que tengas autorización.
- No ingreses credenciales ni datos sensibles.
- No intentes utilizar la plataforma para acceder a sistemas privados.
- Considera los resultados como apoyo para una revisión, no como sustituto de una auditoría especializada.
- Comparte informes y capturas solo cuando tengas autorización para hacerlo.

---

## 9. Preguntas frecuentes

### ¿Por qué debo utilizar el mismo navegador?

El espacio de trabajo está asociado a una cookie del navegador. Mantener el mismo perfil permite volver a consultar el historial vinculado a ese espacio.

### ¿Puedo analizar cualquier dirección?

Debes utilizar una dirección pública accesible desde Internet y escrita con `https://` o `http://`. Una URL privada o protegida puede no ser procesable.

### ¿Qué hago si no aparece el informe?

Comprueba si el análisis terminó y si se guardó. Si hubo un problema de persistencia, espera a que el servicio esté disponible y utiliza **Reintentar** cuando la interfaz lo ofrezca.

### ¿El puntaje o los hallazgos certifican que un sitio cumple la ley?

No. Son resultados orientativos del análisis disponible y no reemplazan una auditoría legal o técnica integral.

### ¿El asistente es obligatorio?

No. Puedes revisar los hallazgos y las evidencias directamente en el informe. El asistente es una función de apoyo y puede estar temporalmente deshabilitado.

---

## 10. Solución de problemas

| Situación | Qué revisar o hacer |
|---|---|
| La URL no se acepta | Comprueba que comience con `https://` o `http://`, que esté bien escrita y que el sitio sea público. |
| El análisis tarda | Espera a que termine el proceso y evita enviar varias solicitudes repetidas. |
| El servidor no puede guardar el análisis | Puede existir una interrupción de persistencia. Espera a que PostgreSQL vuelva a estar disponible y utiliza **Reintentar** si aparece esa opción. |
| No encuentras un análisis anterior | Vuelve al navegador y perfil con el que lo creaste. Comprueba que las cookies del sitio estén habilitadas. |
| El informe no carga | Actualiza la página una vez. Si persiste, vuelve al panel e intenta abrirlo desde **Historial**. |
| El asistente está ocupado o deshabilitado | Continúa revisando **Hallazgos** y **Evidencias**. Intenta nuevamente más tarde. |
| La aplicación no abre | Comprueba tu conexión, vuelve a cargar la página y verifica que estás usando el enlace publicado. |

Si el problema continúa, registra el mensaje de error, la acción que estabas realizando y la hora aproximada. No incluyas contraseñas, tokens ni claves en el reporte.

---

## 11. Enlaces de referencia

- [Abrir aplicación PRIVACYOS](https://privacyos-v2.vercel.app/)
- [Repositorio del proyecto](https://github.com/catalinica1234-tech/privacyos-v2)
- [Manual técnico e instalación](./manual-tecnico.md)
- [Documentación del Hito 3](../README.md)
- [Índice general de manuales](../../MANUALES/README.md)

---

*Documento de apoyo para la utilización de PRIVACYOS en el contexto del proyecto académico. La interfaz y las funciones disponibles pueden variar según la versión desplegada y su configuración.*
