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
- Rutas operations dashboard solo lectura para mock runtime, provider events, audit, metricas y
  evals.
- Rutas Internal Dialer readiness/dry-run, sin dispatch ni cliente HTTP.
- Runtime composition explicita con `API_SERVICES_MODE=fake|prisma`.
- Auth production blocker con `AUTH_MODE=header-dev|jwt-required`.

No hay runtime de llamadas real, workers daemon, providers reales, deploy ni llamadas reales. La DB
solo se usa con Prisma inyectado y PostgreSQL efimero en tests de integracion.

El ejecutable `main.ts` no debe usar fake services de forma implicita. En produccion requiere
`API_SERVICES_MODE=prisma`, `DATABASE_URL`, `AUTH_MODE=jwt-required` y una referencia futura de
auth. Hasta implementar JWT real, `jwt-required` bloquea rutas protegidas.

Los hooks de observabilidad no registran bodies crudos, headers sensibles ni datos de proveedor. Las
rutas protegidas generan audit events con `tenantId`, `actorId` y `correlationId`.

Los runtime blockers rechazan flags peligrosos y campos sensibles antes de ejecutar logica de ruta.
No hay dispatch real, provider egress, deploy productivo ni data export.

CEDCO D02 usa allowlists de metadata en endpoints sensibles. No se aceptan claves arbitrarias ni
valores con PII, transcript/audio crudo, secretos o provider URLs.

La ruta `mock-call-flows` es explicita de mock y no dispara llamadas ni proveedor. Devuelve
referencias `mock_call_*`, eventos sinteticos y resumen seguro.

La ruta `mock-provider-events` exige firma sintetica `x-hyperion-mock-signature`, bloquea replay,
normaliza solo eventos `provider.mock.*` y rechaza payload crudo, transcript, audio, telefono,
email, documento y secretos.

Las rutas `operations/dashboard` son GET-only. Devuelven read models sanitizados, preservan
`correlationId` y no disparan jobs, llamadas, provider egress, evals remotos ni acciones de consola.

Las rutas `integrations/internal-dialer/readiness` y `integrations/internal-dialer/dry-run` exponen
solo estado P0 y validacion sintetica mediante `BlockedInternalDialerAdapter`.

## Tests

Los tests usan `Fastify.inject` y no ejecutan `listen`.

`pnpm test:integration:api` corre contra `DATABASE_URL` si existe; si no existe, se salta en local.
