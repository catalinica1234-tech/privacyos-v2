# Manual técnico

## Instalación local

Requisitos: Node.js 20 o posterior, npm y una base PostgreSQL de pruebas vacía. Copia `.env.example` a `.env` y configura allí `DATABASE_URL` y `DIRECT_URL` para la base de pruebas. En PostgreSQL local pueden apuntar al mismo destino. Para el asistente opcional, configura `ASSISTANT_ENABLED=1` y `GEMINI_API_KEY` en el entorno del servidor. `ASSISTANT_MODEL` permite indicar el primer modelo que se intenta.

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Comprueba `GET /api/health`, abre el panel e inicia un análisis ficticio. En otro perfil del navegador, comprueba que el historial del primer perfil queda fuera de su espacio.

## Arquitectura y verificación

La UI usa rutas de Next.js. Las rutas validan entradas y llaman a servicios, los repositorios encapsulan Prisma y PostgreSQL almacena los datos. El middleware crea una cookie de espacio y las consultas usan su hash. El asistente recupera el informe por ID dentro del workspace antes de enviar contexto reducido a Gemini.

Ejecuta `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`. Con el servidor local y PostgreSQL de pruebas, ejecuta `node scripts/test-crud.mjs http://localhost:3000`. El script crea y borra registros ficticios.

| Síntoma | Comprobación |
|---|---|
| Health 503 | Verifica que el servidor de pruebas esté en ejecución y que Prisma use la URL esperada. |
| Prisma Client sin generar | Ejecuta `npx prisma generate` después de instalar. |
| Puerto ocupado | Inicia Next.js en otro puerto con `npm run dev -- --port 3001`. |

## Preparación de producción

Identifica la base que usa Vercel y verifica su respaldo antes de revisar el estado de las migraciones. `20261102000000_workspace_isolation` deja filas previas sin propietario fuera de los nuevos espacios. Revisa ese impacto antes de autorizar la migración. Configura credenciales directamente en el gestor de variables de Vercel. Tras un despliegue autorizado, verifica el alias, health, persistencia, aislamiento y asistente.

[Integración Supabase, variables y plan de reversión](../../DESPLIEGUE/integracion-supabase.md).
