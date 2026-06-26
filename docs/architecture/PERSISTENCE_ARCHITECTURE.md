# Persistence Architecture

Loop 6 introduce persistencia real para Hyperion Platform con PostgreSQL como target y Prisma como
schema/client. La capa vive en `packages/db` y queda debajo de los dominios ya definidos: Core
Platform, Agent Platform, Voice Platform y CEDCO D02.

## Componentes

- `packages/db/prisma/schema.prisma`: modelo canonico de base de datos.
- `packages/db/prisma/migrations/0001_initial_hyperion_platform/migration.sql`: migracion inicial
  generada desde el schema sin conectarse a una base real.
- `packages/db/src/prisma/prisma-client.ts`: factory de cliente Prisma con `databaseUrl` inyectado
  por runtime futuro.
- `packages/db/src/mappers/*`: traduccion dominio <-> persistencia con metadata sanitizada.
- `packages/db/src/repositories/*`: implementaciones Prisma de ports principales.
- `packages/db/src/schema-guards/*` y `tools/db-schema-check.mjs`: validaciones de seguridad del
  schema.

## Cobertura

El schema cubre tenants, actors basicos, memberships, audit logs, feature flags, versioned
resources, feedback, outbox, agents, versions, deployments, prompts, flows, knowledge bases, evals,
call sessions, call events, conversation turns, handoffs, provider events sanitizados, post-call
results sanitizados y entidades CEDCO D02.

Los modelos operativos incluyen `tenantId`. Los modelos de eventos que requieren trazabilidad
incluyen `correlationId`. `OutboxEvent` queda listo para event-driven interno futuro.

## Repositorios

Los repositorios Prisma implementan ports de dominio sin cambiar los contratos. La conversion de
filas Prisma a entidades de dominio queda encapsulada en mappers y helper de hidratacion de
persistencia.

## Todavia no existe

No hay API HTTP, dashboard, workers reales, runtime de llamadas, adapters de proveedor, scheduling
real, eligibility real, LLM/STT/TTS real, smoke tests ni conexion a PostgreSQL real.

## Conexion futura

La API/runtime futuro debera obtener `databaseUrl` desde secret manager o configuracion segura y
pasarlo a `createPrismaClient`. El dominio no debe leer variables de entorno ni conocer Prisma.
