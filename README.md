<div align="center">

# PRIVACYOS

### Inteligencia para comprender la privacidad digital

**Observa. Analiza. Comprende. Prioriza.**

PRIVACYOS es una plataforma web que transforma señales técnicas observables de un sitio web en hallazgos explicables, ayudando a comprender posibles riesgos de privacidad y a decidir qué revisar primero.

[**Abrir aplicación**](https://privacyos-v2.vercel.app/) · [Ver presentación](docs/PRIVACYOS_Presentacion.html) · [Ver presentación PDF](docs/PRIVACYOS_Presentacion.pdf)

</div>

---

## ¿Por qué PRIVACYOS?

La privacidad digital suele ser difícil de evaluar: las políticas pueden ser extensas, las tecnologías presentes en un sitio no siempre son evidentes y la información técnica puede resultar compleja para quienes necesitan tomar decisiones.

PRIVACYOS propone una experiencia que organiza señales técnicas observables y las presenta de forma comprensible. La intención es reducir la distancia entre la evidencia técnica y la comprensión del usuario, sin convertir los resultados en afirmaciones que la herramienta no pueda demostrar.

## ¿Qué permite hacer?

- **Iniciar un análisis:** ingresar un sitio web público para realizar una revisión técnica acotada.
- **Consultar hallazgos:** revisar señales obtenidas durante el análisis y comprender por qué podrían ser relevantes.
- **Interpretar resultados:** presentar la información de manera estructurada para facilitar su lectura y priorización.
- **Revisar el historial local:** consultar análisis guardados en el navegador utilizado.
- **Explorar una interfaz responsive:** utilizar la aplicación desde distintos tamaños de pantalla.

### Recorrido principal

`Dashboard → Nuevo análisis → Progreso → Informe de resultados`

> El alcance del análisis es acotado. No realiza un rastreo exhaustivo de todas las páginas o servicios de un sitio, y los resultados dependen de la evidencia que puede observarse durante la consulta.

## Acceso al producto

| Sección | Acceso |
|---|---|
| Aplicación desplegada | [privacyos-v2.vercel.app](https://privacyos-v2.vercel.app/) |
| Dashboard | [Abrir dashboard](https://privacyos-v2.vercel.app/app/dashboard) |
| Nuevo análisis | [Iniciar análisis](https://privacyos-v2.vercel.app/app/nuevo) |
| Presentación interactiva | [Abrir presentación HTML](docs/PRIVACYOS_Presentacion.html) |
| Presentación en PDF | [Consultar PDF](docs/PRIVACYOS_Presentacion.pdf) |

## Cómo funciona

1. **Entrada:** la persona proporciona la dirección de un sitio web público.
2. **Validación:** el servidor valida la entrada y aplica comprobaciones destinadas a reducir riesgos de solicitudes a destinos no permitidos.
3. **Observación:** el endpoint de análisis consulta un conjunto limitado de señales técnicas disponibles públicamente.
4. **Presentación:** la aplicación organiza los hallazgos para facilitar su comprensión.
5. **Consulta:** el usuario revisa los resultados y decide qué aspectos requieren una evaluación adicional.

El endpoint principal de análisis es `POST /api/analyze`. La revisión técnica es limitada y no equivale a una auditoría integral de seguridad o privacidad.

## Arquitectura y tecnologías

PRIVACYOS utiliza una arquitectura web con responsabilidades separadas entre la interfaz de usuario y la lógica de análisis del servidor.

| Tecnología | Responsabilidad |
|---|---|
| **Next.js (App Router)** | Estructura de la aplicación y rutas web y de servidor. |
| **React** | Construcción de interfaces mediante componentes. |
| **TypeScript** | Tipado estático y mayor claridad en el código. |
| **Tailwind CSS** | Estilos y adaptación responsive de la interfaz. |
| **Zod** | Validación de datos de entrada. |
| **Vercel** | Despliegue de la aplicación web. |

### Diagramas y documentación del producto

- [Diagrama de arquitectura cliente-servidor](docs/diagrama-arquitectura.svg)
- [Mapa del producto y navegación](docs/mapa-producto.svg)
- [Carta Gantt](docs/carta-gantt.html)

## Equipo

- **Catalina Romero** — desarrollo frontend, integración y revisión.
- **Melisa Ibáñez** — investigación, documentación y propuesta de valor.
- **Simón Salgado** — arquitectura y presentación.

## Alcance y transparencia

PRIVACYOS busca aportar claridad, no prometer certezas que la evidencia disponible no permite sostener.

- Los resultados se basan en señales técnicas observables durante una consulta acotada.
- No se realiza crawling exhaustivo ni monitorización continua.
- Las referencias a marcos regulatorios son orientativas; no constituyen asesoría jurídica, certificación ni dictamen de cumplimiento.
- El historial y las preferencias se guardan localmente en el navegador; no se debe asumir sincronización entre dispositivos o usuarios.
- La aplicación se presenta como una solución web responsive, no como una aplicación nativa para iOS o Android.
- Las capacidades futuras deben distinguirse de las funciones que están disponibles actualmente.

## Ejecutar el proyecto localmente

Requisitos: Node.js y npm.

```bash
git clone https://github.com/catalinica1234-tech/privacyos-v2.git
cd privacyos-v2
npm install
npm run dev
```

Luego abre [http://localhost:3000](http://localhost:3000).

Si el proyecto utiliza variables de entorno en tu configuración local, revisa el archivo `.env.example` y define únicamente los valores necesarios para el entorno. No publiques credenciales, tokens ni secretos en el repositorio.

## Presentación del proyecto

La presentación HTML se puede abrir directamente desde GitHub o descargar para utilizarla en un navegador moderno. Incluye navegación entre diapositivas y enlaces para acceder a la aplicación desplegada. Si el navegador bloquea una demostración incrustada, utiliza los enlaces directos de la presentación.

---

<div align="center">

**PRIVACYOS — Inteligencia para la privacidad digital**

Una herramienta de apoyo para convertir señales técnicas en información más comprensible.

</div>
