# PRIVACYOS

### The intelligence layer for digital privacy.

**Analiza. Comprende. Protege.**

PRIVACYOS es una plataforma de análisis de privacidad digital que identifica señales de riesgo en sitios web, organiza evidencias y presenta informes con recomendaciones. Ayuda a personas y organizaciones a comprender cómo los servicios digitales gestionan la privacidad de sus usuarios y a decidir qué revisar primero.

## Accede a PRIVACYOS

**[Abrir la aplicación web](https://privacyos-v2.vercel.app/)** · **[Abrir presentación](https://privacyos-hito2-presentacion-8h88bxy73-privacyos.vercel.app)**

![Captura del panel de PRIVACYOS](docs/evidence/capturas/dashboard.png)

## ¿Qué ofrece PRIVACYOS?

- **Análisis de privacidad e identificación de riesgos.** Inspecciona señales técnicas de sitios públicos y reúne evidencias para orientar la revisión.
- **Informes y resultados.** Presenta hallazgos, un puntaje orientativo y recomendaciones priorizadas.
- **Asistente inteligente.** Permite consultar un informe y hacer preguntas de seguimiento con Gemini cuando el asistente está habilitado.
- **Gestión de sitios e historial.** Organiza sitios y análisis por workspace y permite comparar resultados.

La persistencia, el aislamiento entre workspaces y el asistente se verificaron en un entorno de pruebas. La disponibilidad de estas funciones en el enlace público depende de su despliegue y configuración.

## Tecnologías

**Next.js, React y TypeScript** para la aplicación web y sus rutas API. **Prisma y PostgreSQL** para la persistencia, con configuración preparada para **Supabase**. **Gemini** para el asistente del lado del servidor.

## Documentación académica

| Hito | Contenido |
| --- | --- |
| [Informe Hito 1](docs/HITO_1/) | Informe, láminas, enlace al prototipo, mapa del producto y arquitectura inicial. |
| [Hito 2](docs/HITO_2/) | Documento técnico, interfaz de programación, modelo de datos, script de creación y colección de pruebas. |
| [Hito 3](docs/HITO_3/) | Producto funcional y manuales. El índice distingue los materiales disponibles de los entregables pendientes. |

[Manuales de uso e instalación](docs/MANUALES/) · [Arquitectura](docs/ARQUITECTURA/) · [Seguridad](docs/SEGURIDAD/) · [Despliegue](docs/DESPLIEGUE/)

## Estructura del repositorio

| Ruta | Contenido |
| --- | --- |
| [app/](app/) y [components/](components/) | Interfaz, rutas y componentes de la aplicación. |
| [lib/](lib/) | Motor de análisis, servicios y repositorios de datos. |
| [db/](db/) y [prisma/](prisma/) | Script de creación, esquema y migraciones de PostgreSQL. |
| [tests/](tests/), [scripts/](scripts/) y [.github/workflows/](.github/workflows/) | Pruebas, scripts de verificación e integración continua. |
| [docs/](docs/) | Hitos, manuales y referencias técnicas. |

### Ejecutar en local

Usa Node.js 20 o posterior y PostgreSQL local de pruebas. Copia [.env.example](.env.example) a .env y configura DATABASE_URL y DIRECT_URL para esa base.

    npm ci
    npx prisma generate
    npx prisma migrate deploy
    npm run dev

Abre [http://localhost:3000](http://localhost:3000).

## Proyecto académico

- **Asignatura** — INGT Proyecto Semestral
- **Institución** — Universidad Mayor
- **Proyecto** — PRIVACYOS

---

## Manual de uso de PRIVACYOS

¿Es tu primera vez utilizando la plataforma? Consulta la guía completa paso a paso:

**[📘 Abrir el Manual de Uso de PRIVACYOS](docs/HITO_3/manuales/manual-de-uso.md)**

El manual explica cómo ingresar a la aplicación, iniciar un análisis, seleccionar los marcos disponibles, interpretar hallazgos y evidencias, consultar el historial, utilizar el asistente inteligente y resolver problemas frecuentes.
