# Parallel Workstreams

## Workstream A - CEDCO D02 / Calls / Voice / Dialer

Responsable de D02, mock/runtime de llamadas, voice platform, provider event ingestion, evals D02 y
dashboard operacional de llamadas.

No debe tocar:

- `modules/products/cedco/d03-fixed-assets/`.
- Documentacion D03 salvo enlaces de coordinacion.

## Workstream B - CEDCO D03 / Fixed Assets

Responsable de activos fijos CEDCO en el carril `d03-fixed-assets`.

No debe tocar:

- `modules/products/cedco/d02-calls/`.
- `modules/voice/`.
- `apps/workers/src/jobs/voice/`.
- Rutas D02.
- Evals D02.
- Dashboard D02.
- Provider adapters.

## Workstream C - Platform Hardening

Responsable de repo guard, CI, branch protection docs, security baselines, observability, audit,
tenancy y hardening transversal.

Debe coordinar cambios que afecten:

- `package.json`.
- `pnpm-lock.yaml`.
- `.github/workflows/ci.yml`.
- `packages/db/prisma/schema.prisma`.
- `tools/repo-guard.mjs`.
- `tools/db-schema-check.mjs`.

## Coordinacion Prisma

- Una migracion por loop.
- No mezclar D02 y D03 en una migracion sin decision explicita.
- Revisar `schema.prisma` y migration SQL antes del PR.
- Ejecutar `pnpm db:schema:check` y integration tests efimeros.

## Coordinacion API

- Cada vertical registra rutas en archivos propios.
- No crear rutas D03 dentro de routers D02.
- No crear rutas de dispatch o provider egress.
- Mantener GET/read-model separado de actions.

## Coordinacion Dashboard

- Paneles D02 y D03 deben quedar desacoplados.
- Los controles peligrosos siguen deshabilitados hasta approvals futuros.
- No usar datos reales ni URLs externas.
