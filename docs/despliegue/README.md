# Despliegue

La versión pública revisada sirve el commit `6026d265`. La corrección de aislamiento y la integración de Supabase se prepararon en las ramas locales de seguridad y backend y requieren verificación en el destino autorizado. La contención del acceso público a datos sigue pendiente.

- [Guía técnica local](../hito-3/manual-tecnico.md) para instalar y probar el repositorio.
- [Runbook histórico](../deployment/despliegue.md) para consultar procedimientos y antecedentes. Sus estados y ejemplos corresponden a una revisión anterior.
- [Pruebas](../pruebas/README.md) y [seguridad](../seguridad/README.md) para localizar verificaciones y límites.

Antes de preparar un despliegue, identificar commit y entorno, verificar persistencia y aislamiento con datos ficticios y trabajar con las credenciales del entorno autorizado.
