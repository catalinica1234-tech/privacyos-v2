# PRIVACYOS · Guion de demostración en vivo · Hito 2 (7:00)

> Regla de oro del hito: **demo EN VIVO**. La grabación no reemplaza la demostración.
> Reparto: **Catalina Romero** (frontend, pantallas), **Melisa Ibáñez** (documentación, BD y
> colección Postman), **Simón Salgado** (arquitectura, API y asistente IA).

## Preparación (antes de la cámara)

- Abrir 4 pestañas y dejarlas listas: **(1)** URL de producción `https://privacyos-v2.vercel.app`,
  **(2)** colección Postman `docs/privacyos-hito2.postman_collection.json`, **(3)** `db/erd.mmd`
  renderizado, **(4)** el informe técnico `docs/hito2-informe.pdf`.
- Celular de respaldo con la misma URL (si el portátil falla, la demo sigue).
- Plan B ya implementado: si el proveedor de IA no responde, la app muestra mensaje amable y
  **sigue funcionando** — decirlo en voz alta si pasara: es una virtud del diseño.

## Minuto a minuto

### 0:00–1:00 · Enmarcación (Melisa)
- «El Hito 1 entregó el producto; hoy mostramos el **backend real**: la misma app, ahora con
  base de datos y una API REST completa.»
- Mostrar portada del informe, tabla Hito 1 → Hito 2 (persistencia real, 9 rutas, códigos HTTP).
- Anuncio de la regla de la demo: «Todo lo que verán corre contra Postgres en nube, no contra
  mi computador.»

### 1:00–2:30 · La base de datos (Melisa)
- Abrir `db/erd.mmd`: dos tablas, `sites` y `analyses`, FK `siteId → sites.id` con
  **RESTRICT**. «No se puede borrar un sitio que tiene análisis: la base lo impide y la API
  responde 409.»
- Mostrar `db/init.sql` y decir que el diff Prisma ↔ base da **vacío** (cero derivas).
- Credenciales: solo variables de entorno; en el repo hay `.env.example` sin secretos.

### 2:30–4:00 · CRUD en vivo desde Postman (Melisa + Simón)
- Ejecutar la colección encadenada (15 peticiones): crear sitio → listar → PATCH notas →
  analizar (motor real + persistencia) → listar por `siteId` → PATCH análisis → DELETE →
  404 confirmado → DELETE del sitio: primero **409** (tiene análisis), luego 204.
- Señalar dos detalles: error uniforme `{"ok", "code", "message", "hint"}` y el formato del
  id `PS-XXXXXX`.

### 4:00–5:30 · El producto (Catalina)
- En la app: «Nuevo análisis» sobre un sitio real (`www.gob.cl`); ver evolución del progreso,
  informe con score, hallazgos con evidencia y plan de acción.
- **Historial**: punto clave — los datos venían de la BD, no del navegador: «Esto es
  Postgres; si limpio el caché del navegador, siguen ahí» (se puede mostrar borrando la
  pestaña y volviendo).
- Comparar dos análisis; pinchar un hallazgo clasificado «insuficiente» para mostrar la
  honestidad del motor (no se rellena lo que no se observó).

### 5:30–6:30 · Asistente de IA con guardas (Simón)
- Abrir un informe, widget del asistente: pregunta «¿Qué significa "cookie sin SameSite"?» —
  respuesta breve en lenguaje claro.
- Señalar guardas: la respuesta se ancla **solo al JSON del informe**; nunca declara
  cumplimiento legal; está marcada «no es asesoría legal»; la llave vive solo en el servidor;
  feature flag la apaga por completo si hiciera falta.
- (Si el proveedor falla): mostrar el mensaje amable y pasar a la sección siguiente sin drama.

### 6:30–7:00 · Cierre (Melisa)
- Checklist DoD proyectado: 2 recursos CRUD, persistencia real, códigos HTTP, secretos fuera
  del repo, levanta en otro equipo, Postman importable, test 21/21.
- «Está publicado y desplegado: en cualquier equipo entra a la URL con la app y a la BD real.»

## Fallbacks de contingencia (decididos antes de la demo)

| Riesgo | Respuesta |
|---|---|
| No hay internet | Coordinar la red de la sala 24 h antes; la demo vive en la nube por diseño |
| Supabase pausada (plan free) | Cuenta activa 5 min antes; el front muestra el modo respaldo con honor y la demo continúa con el motor y el histórico local |
| Proveedor de IA saturado | Mensaje amable integrado; continuar con la siguiente sección sin exponer la caída |
| Portátil muere | URL en el celular de respaldo |
