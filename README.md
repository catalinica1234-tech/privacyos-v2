# PRIVACYOS — Identidad «Serenidad» (Hito 1)

Plataforma de inteligencia para la privacidad digital: analiza un sitio web público, observa
**evidencia técnica real** (cabeceras HTTP de seguridad, cookies de la primera respuesta, HTML
inicial, `robots.txt`, DNS) y presenta un **informe profesional** con score explicable,
hallazgos clasificados honestamente (confirmado / posible / riesgo técnico / insuficiente /
preventivo), relación normativa indicativa y un **plan de acción priorizado**.

> Este proyecto es una reconstrucción desde cero. **No reutiliza** el repositorio anterior
> (`catalinica1234-tech/privacyos`), que permanece intacto.

---

## Qué es real y qué no (transparencia del producto)

| Componente | Estado en Hito 1 |
| --- | --- |
| Validación de URLs (protocolo, puertos, DNS, anti-SSRF, redirecciones revalidadas) | ✅ Real (servidor) |
| Consulta HTTP limitada a la página inicial + cabeceras + cookies + HTML ≤ N bytes + robots.txt | ✅ Real (motor `1.0.0-sereno`) |
| Score, hallazgos, recomendaciones y evidencias derivadas | ✅ Solo desde evidencia observada |
| Historial, perfil y preferencias | ⚠️ `localStorage` del navegador (sin base de datos) |
| Cuentas / autenticación | 🕑 Fase 2 (arquitectura preparada, no implementada) |
| Crawling, análisis del texto de políticas, monitorización continua | 🕑 Fuera de alcance del Hito 1 (se declara en cada informe) |
| Dataset ilustrativo | 🏷️ Marcado siempre con la píldora «MUESTRA ILUSTRATIVA» y `dataMode: sample` |

Ley 21.719 (Chile): publicada el **13-DIC-2024**, entra en vigor el **01-DIC-2026**
(verificado en [LeyChile](https://www.leychile.cl/leychile/navegar?idNorma=1209272)). Hasta esa
fecha rige la Ley 19.628. PRIVACYOS usa 21.719 como marco *preparatorio* y lo identifica así.

**PRIVACYOS no emite dictámenes legales ni determina cumplimiento.**

---

## Ejecución local

Requisitos: Node.js 18+ (desarrollado con Node 24).

```bash
npm install
cp .env.example .env.local   # opcional: ajusta ANALYZE_TIMEOUT_MS si tu plan de Vercel es más corto
npm run dev                  # http://localhost:3000
```

Validaciones técnicas:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # build de producción
```

---

## Despliegue en Vercel

1. Sube este proyecto a un **repositorio GitHub nuevo e independiente** (esta carpeta ya es un
   proyecto autocontenido; revisa `.gitignore`).
2. En Vercel: *Add New Project* → importa el repo → framework **Next.js** (detectado).
3. Variables de entorno (todas opcionales, ver `.env.example`):
   - `NEXT_PUBLIC_SITE_URL` — URL pública del despliegue.
   - `ANALYZE_TIMEOUT_MS` — timeout del fetch externo (**recomendado ≤ 8000** en planes con límite de 10 s; mantenlo por debajo del tope de tu plan).
   - `ANALYZE_MAX_BODY_BYTES`, `ANALYZE_MAX_REDIRECTS` — ajustes del motor.
4. La ruta `/api/analyze` usa `runtime = "nodejs"` y `maxDuration = 30`; reduce `maxDuration`
   si tu plan no lo permite.

---

## Arquitectura

```
app/
  page.tsx                    Landing comercial (Serenidad)
  app/                        Aplicación (shell propio, navegación completa)
    dashboard · nuevo · progreso/[jobId] · informe/[id]
    historial · comparar · regulatorio · derechos · perfil · configuracion
  api/analyze/route.ts        Motor real (POST, Node runtime, SSRF-safe)
components/                   Sistema de diseño Serenidad + shell + landing
lib/
  contracts.ts                Contratos Zod compartidos UI ↔ motor
  frameworks.ts               Catálogo normativo con fuentes oficiales
  analyzer/safety.ts          Guardas anti-SSRF (DNS, rangos privados, puertos)
  analyzer/engine.ts          Motor de evidencia y hallazgos (sin datos inventados)
  store.ts                    Persistencia local (localStorage) — reemplazable por API
  sample.ts                   Dataset ilustrativo (siempre marcado)
  export.ts                   Exportación .md/.json/copiar
```

Preparado para la fase 2: `lib/store.ts` es la única costura entre la interfaz y la
persistencia; el día que exista backend (autenticación + base de datos), se cambia este
módulo por un adaptador HTTP sin tocar las pantallas.

---

## Identidad visual Serenidad

- Paleta: marfil (fondo), grafito (texto), verde bosque (acción principal), menta (señal positiva),
  con escala de riesgo (bajo/medio/alto/crítico) en modos claro y oscuro.
- Tipografía: Instrument Sans (títulos/UI) + Inter (texto), números tabulares.
- Tokens en `app/globals.css` + mapeo en `tailwind.config.ts`; modo oscuro por clase `.dark`
  sin parpadeo (script inline en `app/layout.tsx`).

## Límites y advertencias

- Los resultados reflejan la observación de la **fecha de ejecución**; los sitios cambian.
- La detección de terceros se basa en firmas conocidas (GA/GTM, Meta Pixel, Clarity, Hotjar, etc.).
- Las relaciones entre evidencia y normativas son **indicativas**; no hay cálculo de sanciones.
- Contacto de demostración en el footer (`contacto@privacyos.cl`): cámbialo por el real antes de publicar.
