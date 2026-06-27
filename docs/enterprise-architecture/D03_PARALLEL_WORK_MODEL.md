# D03 Parallel Work Model

## Starting Point

D03 work starts from `main`.

Recommended branch:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feature/cedco-d03-fixed-assets-domain-expansion
```

## Allowed Paths

- `modules/products/cedco/d03-fixed-assets/`.
- `packages/testing/src/products/cedco/d03-fixed-assets/`.
- `docs/product/CEDCO_D03_*`.
- `docs/architecture/CEDCO_D03_*`.
- `docs/security/CEDCO_D03_*`.
- `docs/delivery/LOOP_D03_*`.

## Forbidden Paths Without Coordinated Approval

- D02 product paths.
- Voice modules.
- Dialer/integration provider adapters.
- Prisma schema or migrations.
- API routes.
- Dashboard.
- Workers.
- Provider SDKs.
- VM or deployment files.

## Current State

D03 has initial domain contracts. It does not have persistence, API, dashboard, workers, import,
export, real files, real inventory, real invoices, real photos, real serial numbers, responsible
persons, or real accounting values.

## Next Recommended Loop

D03-2: fixed-assets domain expansion and test coverage.

Scope:

- Expand value objects.
- Expand policies.
- Expand use cases.
- Expand in-memory tests.
- Keep DB/API/dashboard/workers out of scope.

## PR Checklist

- Only allowed D03 paths touched.
- No real data.
- No D02/voice/dialer/provider imports.
- `pnpm check` passes.
- `pnpm run repo:guard` passes.
- `pnpm db:schema:check` passes.
- `pnpm test` passes.
