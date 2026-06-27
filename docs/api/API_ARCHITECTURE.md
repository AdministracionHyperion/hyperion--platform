# API HTTP Architecture

`apps/api` contiene un skeleton contractual de API HTTP para Hyperion Platform. La app se construye
con `createApiApp(dependencies)` y registra rutas Fastify con servicios inyectados. En este loop los
tests usan `Fastify.inject`, por lo que no se abre ningun puerto.

## Componentes

- `app.ts`: factory de Fastify, error handler y registro de rutas.
- `main.ts`: entrada futura manual. No se ejecuta en CI ni en tests.
- `http/`: contexto de request, envelopes, validacion y errores.
- `contracts/`: DTOs Zod para params y bodies.
- `services/`: contratos de servicios y `FakeApiServices` para tests.
- `routes/`: rutas publicas, Core, Agent Platform, Voice y CEDCO D02.

## Contexto

Las rutas protegidas reciben `tenantId` en path y actor desde headers controlados para desarrollo:

- `x-actor-id`
- `x-actor-roles`
- `x-correlation-id` opcional
- `x-request-source` opcional

Si falta `x-correlation-id`, el API genera uno y lo devuelve en el envelope.

## Limites

No hay wiring Prisma real, workers, runtime de llamadas ni proveedor telefonico. Las rutas de Voice
solo crean sesiones/eventos contractuales. Las rutas CEDCO D02 solo ejecutan reglas deterministicas,
mock o evaluaciones de dominio.

El wiring real con persistencia y secret manager queda para loops posteriores.
