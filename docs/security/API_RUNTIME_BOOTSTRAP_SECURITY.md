# API Runtime Bootstrap Security

El bootstrap del API ejecutable debe fallar cerrado cuando la configuracion puede exponer fake
services o auth dev en un entorno productivo.

## Controles

- Produccion requiere servicios Prisma explicitos.
- Produccion no puede arrancar con fake services.
- Prisma requiere `DATABASE_URL`.
- `DATABASE_URL` en non-test exige `API_SERVICES_MODE` explicito para evitar fallback silencioso.
- Los errores de bootstrap no imprimen secretos.

## Restricciones

- No provider keys.
- No llamadas reales.
- No provider egress.
- No deploy.
- No `.env` real versionado.

## Pendiente

Auth JWT real, secret manager, observabilidad operativa externa y deploy separado siguen fuera de
este loop.
