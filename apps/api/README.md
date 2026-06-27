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

No hay runtime de llamadas, dashboard, workers, providers reales, deploy ni llamadas reales. La DB
solo se usa con Prisma inyectado y PostgreSQL efimero en tests de integracion.

## Tests

Los tests usan `Fastify.inject` y no ejecutan `listen`.

`pnpm test:integration:api` corre contra `DATABASE_URL` si existe; si no existe, se salta en local.
