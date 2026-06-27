# API HTTP Architecture

`apps/api` contiene la API HTTP contractual de Hyperion Platform. La app se construye con
`createApiApp(dependencies)` y registra rutas Fastify con servicios inyectados. Los tests usan
`Fastify.inject`, por lo que no se abre ningun puerto.

## Componentes

- `app.ts`: factory de Fastify, error handler y registro de rutas.
- `main.ts`: entrada futura manual. No se ejecuta en CI ni en tests.
- `http/`: contexto de request, envelopes, validacion y errores.
- `contracts/`: DTOs Zod para params y bodies.
- `services/`: contratos, `FakeApiServices` y `PrismaBackedApiServices`.
- `composition/`: wiring Prisma, repositorios y mappers API.
- `integration/`: harness y tests con PostgreSQL efimero.
- `routes/`: rutas publicas, Core, Agent Platform, Voice y CEDCO D02.

## Contexto

Las rutas protegidas reciben `tenantId` en path y actor desde headers controlados para desarrollo:

- `x-actor-id`
- `x-actor-roles`
- `x-correlation-id` opcional
- `x-request-source` opcional

Si falta `x-correlation-id`, el API genera uno y lo devuelve en el envelope.

## Limites

Existe wiring Prisma controlado para integration tests. No hay workers, runtime de llamadas ni
proveedor telefonico. Las rutas de Voice solo crean sesiones/eventos; nunca hacen dispatch. Las
rutas CEDCO D02 ejecutan reglas deterministicas, mock o evaluaciones de dominio.

El secret manager, auth real y wiring de produccion quedan para loops posteriores.
