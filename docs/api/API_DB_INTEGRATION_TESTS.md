# API DB Integration Tests

Los tests de integracion API validan Fastify inject + Prisma + PostgreSQL efimero.

## CI

El workflow `CI / Verify` incluye el job `api-integration`. Ese job:

- levanta un service PostgreSQL temporal;
- usa credenciales sinteticas `hyperion_test`;
- ejecuta `pnpm db:validate`;
- ejecuta `pnpm db:generate`;
- aplica migraciones con `pnpm db:migrate:test`;
- corre `pnpm test:integration:api`;
- ejecuta `pnpm db:schema:check`;
- ejecuta `pnpm run repo:guard`.

No usa secrets, no conecta DB externa, no hace deploy y no abre un servidor HTTP real.

## Local

Con PostgreSQL temporal disponible:

```powershell
$env:DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public"
pnpm db:migrate:test
pnpm test:integration:api
Remove-Item Env:\DATABASE_URL
```

Si `DATABASE_URL` no existe, el suite se salta en ejecucion local normal.

## Endpoints validados

- Health y version.
- Core tenant context y feature flags.
- Agent creation y AgentVersion draft.
- Voice CallSession, CallEvent y aislamiento por tenant.
- CEDCO D02 configuration, intents, compliance, handoff, scheduling, eligibility y metrics.

## Limites

No valida produccion, auth real, rate limiting, proveedores, llamadas reales, dashboard ni workers.
