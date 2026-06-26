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

## Sin DB real

El CI no levanta PostgreSQL ni ejecuta migraciones contra una base real. Prisma usa un placeholder
controlado dentro del wrapper local para `validate` y `generate`. Las pruebas con DB real quedan
para un loop futuro de integration tests.

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
```

## Que bloquea repo guard

- `_private/` trackeado.
- R03, assets o activos fijos bajo CEDCO.
- `.env`, `.env.local` o `.env.production` trackeados.
- `node_modules`, `dist`, `build` o `coverage` trackeados.
- Word, zip o PDF trackeados sin autorizacion futura.
- Imports de proveedores reales en dominio o `packages/db`.
- `process.env` en dominio o `packages/db`.
- Red real en dominio.
- Columnas Prisma prohibidas para transcript/audio/telefono.
- `DATABASE_URL` real hardcoded.
- Asignaciones aparentes de secretos reales.

## Falta para produccion

Faltan branch protection activa, integration tests con base efimera, revision de migraciones en
entorno controlado, observabilidad operativa, manejo de secrets, retencion de datos, runtime y
deploy separados.
