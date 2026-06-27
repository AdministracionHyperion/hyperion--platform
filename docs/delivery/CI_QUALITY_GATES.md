# CI Quality Gates

`CI / Verify` valida cada push a `main`, cada push a `foundation/**`, cada pull request hacia `main`
y ejecuciones manuales.

## Que valida

- `pnpm install --frozen-lockfile`.
- `pnpm check`.
- Formato con Prettier.
- ESLint.
- Prisma format, validate y generate.
- TypeScript typecheck.
- Vitest.
- Secret scan.
- Architecture check.
- DB schema check.
- Repo guard.
- Job `db-integration` con PostgreSQL temporal.
- Job `api-integration` con PostgreSQL temporal y Fastify inject.
- Tests de observabilidad API dentro de `pnpm check` y del job `api-integration`.
- Tests de policy gates, runtime blockers y rate limits dentro de `pnpm check` y `api-integration`.
- Tests de workers foundation dentro de `pnpm check`.
- Tests de runtime mock CEDCO D02 dentro de `pnpm check` y `api-integration`.
- Tests y gate de evals deterministicas CEDCO D02 dentro de `pnpm check`.
- Tests de dashboard operacional solo lectura dentro de `pnpm check`.

## DB efimera controlada

El job `verify` no levanta PostgreSQL. Los jobs `db-integration` y `api-integration` levantan un
service PostgreSQL temporal con credenciales sinteticas y aplican migraciones solo contra esa base
efimera. No usan una DB de cliente ni una DB externa persistente.

## Sin secrets

El workflow no requiere GitHub Secrets, no imprime secretos y no configura proveedores. Cualquier
variable real de runtime debera venir despues desde secret manager y fuera del dominio.

## Sin deploy

El workflow no despliega, no publica artefactos sensibles, no abre puertos, no hace llamadas y no
ejecuta runtime.

## Como correr localmente

```bash
pnpm install
pnpm check
pnpm db:validate
pnpm db:generate
pnpm db:schema:check
pnpm run repo:guard
pnpm test:evals
pnpm evals:cedco-d02
```

Con PostgreSQL temporal disponible:

```bash
DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public" pnpm db:migrate:test
DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public" pnpm test:integration:db
DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public" pnpm test:integration:api
```

## Que bloquea repo guard

- `_private/` trackeado.
- Paths legacy `r03/`, `assets/` o `activos-fijos` bajo CEDCO.
- `.env`, `.env.local` o `.env.production` trackeados.
- `node_modules`, `dist`, `build` o `coverage` trackeados.
- Word, zip o PDF trackeados sin autorizacion futura.
- Imports de proveedores reales en dominio o `packages/db`.
- Redis/BullMQ antes del loop de workers.
- Workers daemon, `server.listen`, red real o imports de proveedor en `apps/workers`.
- Flags runtime peligrosos hardcodeados en `true` fuera de tests/docs/bloqueadores.
- `process.env` en dominio o `packages/db`.
- Red real en dominio.
- Columnas Prisma prohibidas para transcript/audio/telefono.
- Payload crudo y campos sensibles en contratos de eventos provider.
- Acciones peligrosas habilitadas en dashboard web.
- URLs externas o SDKs de proveedor en `apps/web`.
- D03 fixed assets importando D02, voice, providers, red real o `process.env`.
- Paths `modules/products/cedco/r03`, `assets` o `activos-fijos`.
- `DATABASE_URL` real hardcoded.
- Asignaciones aparentes de secretos reales.

## Falta para produccion

Branch protection de `main` esta configurada para PR, checks requeridos y bloqueo de force push.
Siguen faltando auth real, revision de migraciones en entorno controlado, observabilidad operativa,
manejo de secrets, retencion de datos, runtime y deploy separados.
