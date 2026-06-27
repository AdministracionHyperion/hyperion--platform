# Hyperion API

`apps/api` contiene el skeleton HTTP contractual de Hyperion Platform.

## Estado

- Fastify app factory.
- Rutas publicas de health/version.
- Rutas Core, Agent Platform, Voice y CEDCO D02.
- Contexto por headers controlados para desarrollo/test.
- Zod para validacion.
- Servicios fake inyectados en tests.
- Servicios Prisma inyectados para integration tests con PostgreSQL efimero.
- Observability hooks para request logging, metricas in-memory y audit events sanitizados.
- Policy gates, runtime blockers y rate limits in-memory.
- Ruta CEDCO D02 mock runtime para flujo sintetico end-to-end.

No hay runtime de llamadas, dashboard, workers, providers reales, deploy ni llamadas reales. La DB
solo se usa con Prisma inyectado y PostgreSQL efimero en tests de integracion.

Los hooks de observabilidad no registran bodies crudos, headers sensibles ni datos de proveedor. Las
rutas protegidas generan audit events con `tenantId`, `actorId` y `correlationId`.

Los runtime blockers rechazan flags peligrosos y campos sensibles antes de ejecutar logica de ruta.
No hay dispatch real, provider egress, deploy productivo ni data export.

La ruta `mock-call-flows` es explicita de mock y no dispara llamadas ni proveedor. Devuelve
referencias `mock_call_*`, eventos sinteticos y resumen seguro.

La ruta `mock-provider-events` exige firma sintetica `x-hyperion-mock-signature`, bloquea replay,
normaliza solo eventos `provider.mock.*` y rechaza payload crudo, transcript, audio, telefono,
email, documento y secretos.

## Tests

Los tests usan `Fastify.inject` y no ejecutan `listen`.

`pnpm test:integration:api` corre contra `DATABASE_URL` si existe; si no existe, se salta en local.
