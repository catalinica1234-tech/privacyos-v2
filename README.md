# PRIVACYOS V2

PRIVACYOS convierte señales observables de un sitio web público en hallazgos de privacidad que una persona puede entender y priorizar.

## Problema y propuesta de valor

Las políticas de privacidad, los rastreadores y las configuraciones técnicas son difíciles de interpretar sin experiencia especializada. PRIVACYOS consulta la página inicial y organiza señales como cabeceras, cookies, redirecciones y terceros observables. Cada informe reúne hallazgos, evidencias, limitaciones y recomendaciones. La evaluación es acotada y las referencias regulatorias son orientativas.

## Funcionalidades

- Analizar una URL pública y consultar un informe con hallazgos y evidencias.
- Guardar análisis en PostgreSQL, consultarlos en el historial y comparar dos resultados.
- Gestionar sitios y análisis mediante una API REST.
- Consultar un informe ilustrativo y, cuando se configure Gemini, pedir explicaciones generales o sobre un informe del espacio de trabajo.

La base documentada usa un workspace anónimo ligado a una cookie del navegador. Las cuentas, el inicio de sesión y la recuperación de workspace por identidad quedan pendientes.

## Arquitectura y tecnologías

El proyecto es un monolito modular. La interfaz de Next.js y React llama a rutas REST, los servicios aplican las reglas y los repositorios acceden a PostgreSQL mediante Prisma. TypeScript y Zod definen los contratos, Tailwind CSS organiza la presentación y Vitest ejecuta las pruebas. Gemini es opcional y la aplicación está alojada en Vercel.

| Carpeta | Contenido |
|---|---|
| `app/`, `components/` | Interfaz y rutas HTTP |
| `lib/` | Contratos, analizador, servicios y repositorios |
| `prisma/`, `db/` | Esquema, migraciones, modelo relacional y SQL |
| `tests/`, `scripts/` | Pruebas y utilidades |
| `docs/` | Hitos, manuales y evidencias |

Consulta el [índice de arquitectura](docs/arquitectura/README.md) y el [contrato REST](docs/api.md).

## Instalación local

Requisitos: Node.js 20 o posterior, npm y una base PostgreSQL vacía de desarrollo o pruebas.

1. Ejecuta `npm ci` desde la raíz.
2. Crea un archivo `.env` local a partir de [`.env.example`](.env.example). En `DATABASE_URL` configura exclusivamente tu base de desarrollo o pruebas. Si usas Gemini, configura sus variables solo en el entorno del servidor.
3. Ejecuta los siguientes comandos en la base local de pruebas.

```sh
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Abre `http://localhost:3000`. En **Nuevo análisis**, usa un sitio de ejemplo como `https://example.com`. Para revisar la instalación, los pasos del producto y los errores frecuentes, consulta el [manual de uso](docs/hito-3/manual-de-uso.md) y el [manual técnico](docs/hito-3/manual-tecnico.md).

## Hitos INGT1003

| Hito | Entrada al material |
|---|---|
| 1 · Propuesta · 30 % | [Propuesta, prototipo, mapa y arquitectura](docs/hito-1/README.md) |
| 2 · Back end · 35 % | [API, modelo, pruebas e informes](docs/hito-2/README.md) |
| 3 · Producto funcional · 35 % | [Flujo integrado, manuales y pendientes](docs/hito-3/README.md) |

Consulta la [matriz oficial contrastada](docs/matriz-rubrica-ingt1003.md) y el [índice documental](docs/README.md).

## Pruebas y evidencias

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Con el servidor local y una base desechable, ejecuta `node scripts/test-crud.mjs http://localhost:3000`. El script crea y elimina registros ficticios. El [índice de pruebas](docs/pruebas/README.md) indica qué se ejecutó y el [catálogo de evidencias](docs/evidencias/README.md) identifica su entorno.

## Estado de entrega

El respaldo documental toma como referencia la consolidación local `20be094`. En esa fase se verificaron compilación, 80 pruebas unitarias, 21 comprobaciones CRUD y aislamiento por HTTP, usando una base desechable. La versión pública se evalúa por separado. En la última verificación registrada, la portada estaba accesible y seguía pendiente resolver el aislamiento de la API desplegada y confirmar la base que la sirve. Para la revisión académica, usa el entorno local con datos ficticios.

La rama documental prepara la navegación y la trazabilidad. El video final y la validación del PDF final de Hito 3 siguen pendientes en el inventario. La corrección posterior de aislamiento tiene su propia rama.

## Equipo

- Catalina Romero — frontend, integración y revisión. GitHub: `catalinica1234-tech`.
- Melisa Ibáñez — investigación, documentación y propuesta de valor. GitHub: `melisaibanezdelgado-eng`.
- Simón Salgado — arquitectura, backend y presentación. Usuario de GitHub pendiente de confirmar.
