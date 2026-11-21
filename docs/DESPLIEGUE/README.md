# Despliegue

La versión pública revisada sirve el commit `6026d265`. La corrección de aislamiento y la integración de Supabase están incorporadas en la rama de integración y requieren verificación en el destino autorizado. La contención del acceso público a datos sigue pendiente.

- [Guía técnica local](../HITO_3/manuales/manual-tecnico.md) para instalar y probar el repositorio.
- [Checklist de preproducción](checklist-preproduccion.md) y [procedimiento de contención P0](contencion-p0.md).
- [Runbook histórico](despliegue.md) para consultar procedimientos y antecedentes. Sus estados y ejemplos corresponden a una revisión anterior.
- [Pruebas](../pruebas/README.md) y [seguridad](../SEGURIDAD/README.md) para localizar verificaciones y límites.

Antes de preparar un despliegue, identificar commit y entorno, verificar persistencia y aislamiento con datos ficticios y trabajar con las credenciales del entorno autorizado.
