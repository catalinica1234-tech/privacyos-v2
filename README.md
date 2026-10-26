<div align="center">

# PRIVACYOS

### Inteligencia para comprender la privacidad digital

**Observa. Analiza. Comprende. Prioriza.**

PRIVACYOS es una plataforma web que transforma señales técnicas observables de un sitio web en hallazgos explicables, ayudando a comprender posibles riesgos de privacidad y a decidir qué revisar primero.

[**Abrir aplicación**](https://privacyos-v2.vercel.app/) · [Ver presentación](docs/PRIVACYOS_Presentacion.html) · [Ver presentación PDF](docs/PRIVACYOS_Presentacion.pdf)

</div>

> **Hito 2 (INGT1003):** el análisis ahora se **persiste en PostgreSQL (Supabase) vía Prisma**, con
> una API REST completa de los recursos `sites` y `analyses` (CRUD), separación real de capas y
> un asistente explicativo opcional por IA. La identidad visual y el motor del Hito 1 se conservan.

### Novedades del Hito 2

| Componente | Hito 1 | Hito 2 |
| --- | --- | --- |
| Persistencia | `localStorage` del navegador | **PostgreSQL/Supabase real** (Prisma 6) |
| API | solo `/api/analyze` (aísla motor) | `/api/sites` + `/api/analyses` — CRUD completo (9 rutas) — más `/api/assistant` |
| Códigos HTTP | 200/400/403/504 | 201/200/204/400/403/404/409/500/502/503/504 según caso |
| Capas | motor aislado | route handler → servicio → repositorio → Prisma |
| Asistente explicativo | — | Opcional (IA solo en servidor, guardas anti-invención, dictado de voz) |

---

## ¿Por qué PRIVACYOS?

La privacidad digital suele ser difícil de evaluar: las políticas pueden ser extensas, las tecnologías presentes en un sitio no siempre son evidentes y la información técnica puede resultar compleja para quienes necesitan tomar decisiones.

PRIVACYOS propone una experiencia que organiza señales técnicas observables y las presenta de forma comprensible. La intención es reducir la distancia entre la evidencia técnica y la comprensión del usuario, sin convertir los resultados en afirmaciones que la herramienta no pueda demostrar.

## ¿Qué permite hacer?

- **Iniciar un análisis:** ingresar un sitio web público para realizar una revisión técnica acotada.
- **Consultar hallazgos:** revisar señales obtenidas durante el análisis y comprender por qué podrían ser relevantes.
- **Interpretar resultados:** presentar la información de manera estructurada para facilitar su lectura y priorización.
- **Revisar el historial:** consultar análisis guardados en la base de datos del servidor (con respaldo en el navegador si la API no responde).
- **Explorar una interfaz responsive:** utilizar la aplicación desde distintos tamaños de pantalla.

### Recorrido principal

`Dashboard → Nuevo análisis → Progreso → Informe de resultados`

> El alcance del análisis es acotado. No realiza un rastreo exhaustivo de todas las páginas o servicios de un sitio, y los resultados dependen de la evidencia que puede observarse durante la consulta.

## Qué es real y qué no (transparencia del producto)

| Componente | Estado en Hito 2 |
| --- | --- |
| Validación de URLs (protocolo, puertos, DNS, anti-SSRF, redirecciones revalidadas) | ✅ Real (servidor) |
| Consulta HTTP limitada a la página inicial + cabeceras + cookies + HTML ≤ N bytes + robots.txt | ✅ Real (motor `1.0.0-sereno`) |
| Score, hallazgos, recomendaciones y evidencias derivadas | ✅ Solo desde evidencia observada |
| Persistencia de análisis e informes | ✅ PostgreSQL (Supabase) real vía Prisma; `localStorage` como respaldo |
| CRUD de `sites` y `analyses` | ✅ 9 rutas REST (documento espejo en `docs/api.md`) |
| Asistente explicativo (IA) | ⚠️ Opcional con feature flag (`ASSISTANT_ENABLED`); texto explicativo marcado, **no** asesoría legal |
| Dictado por voz | ✅ Web Speech API del navegador (sin proveedores externos) |
| Cuentas / autenticación | 🕑 Fuera de alcance (los recursos API son de producto, no de sesión) |
| Crawling, análisis del texto de políticas, monitorización continua | 🕑 Fuera de alcance (se declara en cada informe) |
| Dataset ilustrativo | 🏷️ Marcado siempre con la píldora «MUESTRA ILUSTRATIVA» y `dataMode: sample` |

## Acceso al producto

| Sección | Acceso |
|---|---|
| Aplicación desplegada | [privacyos-v2.vercel.app](https://privacyos-v2.vercel.app/) |
| Dashboard | [Abrir dashboard](https://privacyos-v2.vercel.app/app/dashboard) |
| Nuevo análisis | [Iniciar análisis](https://privacyos-v2.vercel.app/app/nuevo) |
| Presentación interactiva | [Abrir presentación HTML](docs/PRIVACYOS_Presentacion.html) |
| Presentación en PDF | [Consultar PDF](docs/PRIVACYOS_Presentacion.pdf) |
| Contrato de la API | [docs/api.md](docs/api.md) |

## Cómo funciona

1. **Entrada:** la persona proporciona la dirección de un sitio web público.
2. **Validación:** el servidor valida la entrada (contratos Zod) y aplica comprobaciones destinadas a reducir riesgos de solicitudes a destinos no permitidos (anti-SSRF).
3. **Observación:** el motor consulta un conjunto limitado de señales técnicas disponibles públicamente.
4. **Persistencia:** en el Hito 2, el análisis queda guardado en PostgreSQL (Supabase) con su score, nivel de riesgo y payload completo (`POST /api/analyses`).
5. **Presentación:** la aplicación organiza los hallazgos para facilitar su comprensión.
6. **Consulta:** el usuario revisa los resultados y decide qué aspectos requieren una evaluación adicional.

El motor aislado sigue disponible en `POST /api/analyze` (sin persistir, igual que el Hito 1).
La revisión técnica es limitada y no equivale a una auditoría integral de seguridad o privacidad.

## Arquitectura y tecnologías

PRIVACYOS es un **monolito modular** en capas: route handlers → servicios → repositorios → Prisma → PostgreSQL.

| Tecnología | Responsabilidad |
|---|---|
| **Next.js (App Router)** | Estructura de la aplicación, rutas web y route handlers de la API. |
| **React + TypeScript** | Interfaces con tipado estático. |
| **Tailwind CSS** | Sistema de diseño «Serenidad» y adaptación responsive. |
| **Prisma 6** | Modelo de datos, migraciones y cliente para PostgreSQL. |
| **PostgreSQL (Supabase)** | Persistencia real de `sites` y `analyses`. |
| **Zod** | Validación de datos compartida entre la UI y la API. |
| **Vercel** | Despliegue de la aplicación y variables de entorno. |

### Estructura del repositorio

```
app/api/            sites · analyses · assistant · analyze (route handlers)
components/         Sistema de diseño Serenidad + shell + asistente-ia
lib/                contracts · db (Prisma singleton) · http (ApiError, envolvente de error)
                    repositories/ · services/ · api-client.ts (degradación a localStorage)
prisma/             schema.prisma + migrations/20261026000000_init (baseline)
db/                 init.sql · erd.mmd · README.md (base desde cero + diagrama ER)
scripts/            test-crud.mjs (21 verificaciones automáticas del CRUD)
docs/               api.md · colección Postman · informe técnico · Gantt · guion
```

El flujo de `POST /api/analyses`: validación con Zod → el servicio genera el id `PS-XXXXXX` y ejecuta el motor → el repositorio guarda en PostgreSQL. Los errores salen como `{"ok":false,"code","message","hint"}` con el código HTTP correcto (400 · 403 · 404 · 409 · 500 · 503 · 504). Las llaves de IA (`GEMINI_API_KEY`) viven solo en el servidor.

### Diagramas y documentación

- [Diagrama de arquitectura cliente-servidor](docs/diagrama-arquitectura.svg)
- [Mapa del producto y navegación](docs/mapa-producto.svg)
- [Carta Gantt Hito 1](docs/carta-gantt.html) · [Gantt Hito 2](docs/hito2-gantt.md)
- [Informe técnico Hito 2 (PDF)](docs/hito2-informe.pdf) · [Guion de demostración (7 min)](docs/hito2-guion.md)
- [Diagrama entidad-relación de la base](db/erd.mmd) · [SQL de creación](db/init.sql)

## Equipo

- **Catalina Romero** — desarrollo frontend, integración y revisión.
- **Melisa Ibáñez** — investigación, documentación y propuesta de valor.
- **Simón Salgado** — arquitectura, backend y presentación.

## Alcance y transparencia

PRIVACYOS busca aportar claridad, no prometer certezas que la evidencia disponible no permite sostener.

- Los resultados se basan en señales técnicas observables durante una consulta acotada.
- No se realiza crawling exhaustivo ni monitorización continua.
- Las referencias a marcos regulatorios son orientativas; no constituyen asesoría jurídica, certificación ni dictamen de cumplimiento.
- El análisis queda guardado en la base de datos del servidor; el navegador conserva una copia local como respaldo si la API no responde.
- La aplicación se presenta como una solución web responsive, no como una aplicación nativa para iOS o Android.
- Las capacidades futuras deben distinguirse de las funciones que están disponibles actualmente.

## Ejecutar el proyecto localmente

Requisitos: Node.js 18+ y una base PostgreSQL accesible (el proyecto usa **Supabase**; todos los servicios tienen capa gratuita).

```bash
git clone https://github.com/catalinica1234-tech/privacyos-v2.git
cd privacyos-v2
npm install
cp .env.example .env.local   # y completa DATABASE_URL con tu PostgreSQL/Supabase
npx prisma generate          # genera el cliente Prisma
```

Para crear el esquema de base de datos hay dos camino:

- **Migraciones (recomendado):** `npx prisma migrate deploy` aplica lo que está en `prisma/migrations/` (baseline `20261026000000_init`).
- **SQL directo:** `npx prisma db execute --schema prisma/schema.prisma --file db/init.sql`.

```bash
npm run dev                  # http://localhost:3000
```

### Probar el CRUD contra la base real

`scripts/test-crud.mjs` recorre las 9 rutas REST y verifica persistencia, validaciones y borrado
(21 verificaciones: 201/200/204/400/403/404/409, formato de id `PS-XXXXXX`, duplicados, FK):

```bash
npm start                              # servidor de producción en :3000
node scripts/test-crud.mjs http://localhost:3000
# al finalizar: ══ RESULTADO: 21 ✓ · 0 ✗
```

El script crea y **borra** sus propios datos (site + analysis de prueba), por lo que es seguro contra la base de producción. Resultado verificado contra el build de producción con Supabase real.

Validaciones técnicas: `npm run typecheck` · `npm run lint` · `npm run build`.

Si el proyecto utiliza variables de entorno en tu configuración local, revisa el archivo `.env.example` y define únicamente los valores necesarios para el entorno. No publiques credenciales, tokens ni secretos en el repositorio.

## Despliegue en Vercel

1. Sube este proyecto a un repositorio GitHub y en Vercel importa el repo (framework **Next.js**, detectado automáticamente).
2. Variables de entorno (ver `.env.example`):

   | Variable | Requerida | Uso |
   | --- | --- | --- |
   | `DATABASE_URL` | ✅ | Cadena de conexión PostgreSQL (Supabase). Contraseña **URL-encodada una vez**; con Supabase usa siempre el **pooler** (`*.pooler.supabase.com`). |
   | `ASSISTANT_ENABLED` | — | `1` activa `/api/assistant` (feature flag); sin ella responde 503. |
   | `GEMINI_API_KEY` | — | Clave del proveedor de IA del asistente (solo servidor). |
   | `CONTACTO_EMAIL` | — | Email de contacto cuando la IA está apagada o fallando. |
   | `NEXT_PUBLIC_SITE_URL` | — | URL pública del despliegue. |
   | `ANALYZE_TIMEOUT_MS` | — | Timeout del fetch externo (recomendado ≤ 8000 en planes con límite de 10 s). |
   | `ANALYZE_MAX_BODY_BYTES`, `ANALYZE_MAX_REDIRECTS` | — | Ajustes del motor. |

3. Tras el primer deploy, verifica la salud del CRUD: `node scripts/test-crud.mjs https://tu-app.vercel.app`.

**Degradación con honor:** si la base de datos no responde, el frontend conserva el historial en `localStorage` y lo marca; la app sigue usable y ningún informe se pierde sin aviso.

## Límites y advertencias

- Los resultados reflejan la observación de la **fecha de ejecución**; los sitios cambian.
- La detección de terceros se basa en firmas conocidas (GA/GTM, Meta Pixel, Clarity, Hotjar, etc.).
- Las relaciones entre evidencia y normativas son **indicativas**; no hay cálculo de sanciones.

---

## Presentación del proyecto

La presentación HTML se puede abrir directamente desde GitHub o descargar para utilizarla en un navegador moderno. Incluye navegación entre diapositivas y enlaces para acceder a la aplicación desplegada. Si el navegador bloquea una demostración incrustada, utiliza los enlaces directos de la presentación.

<div align="center">

**PRIVACYOS — Inteligencia para la privacidad digital**

Una herramienta de apoyo para convertir señales técnicas en información más comprensible.

</div>
