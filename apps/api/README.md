# Hyperion API

`apps/api` contiene el skeleton HTTP contractual de Hyperion Platform.

## Estado

- Fastify app factory.
- Rutas publicas de health/version.
- Rutas Core, Agent Platform, Voice y CEDCO D02.
- Contexto por headers controlados para desarrollo/test.
- Zod para validacion.
- Servicios fake inyectados en tests.

No hay runtime de llamadas, DB real, dashboard, workers, providers reales, deploy ni llamadas
reales.

## Tests

Los tests usan `Fastify.inject` y no ejecutan `listen`.
