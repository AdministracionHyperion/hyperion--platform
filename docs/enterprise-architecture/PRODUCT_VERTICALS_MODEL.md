# Product Verticals Model

## Product Roots

Product verticals live under `modules/products`.

Current verticals:

- `modules/products/cedco/d02-calls`.
- `modules/products/cedco/d03-fixed-assets`.

## Required Product Documents

Every product vertical needs:

- Product scope.
- Vertical boundaries.
- Security baseline.
- Domain roadmap.
- Delivery roadmap.
- Test plan.
- Data policy if persistence exists or is planned.
- Repo guard and architecture check coverage.

## CEDCO D02

D02 owns calls/orientation workflows in the platform. It currently has domain, API, Prisma-backed
safe persistence, workers contracts, mock runtime, provider event ingestion, evals, dashboard, and
controlled dialer dry-run.

D02 still does not own live call dispatch or provider egress.

## CEDCO D03

D03 owns fixed-assets domain contracts. It does not have DB, API, dashboard, workers, import/export,
or production reporting yet.

D03 work can proceed in parallel only in its allowed paths and without touching D02, voice, dialer,
providers, Prisma, API, dashboard, or workers unless a coordinated loop explicitly allows it.

## Adding Future Products

Before adding a product:

- Create product scope.
- Define boundaries.
- Define security baseline.
- Create a roadmap.
- Add tests.
- Add repo guard rules if needed.
- Confirm no collision with existing product paths.

## Isolation Rule

Product verticals must not import each other directly unless a shared contract is promoted to a
shared package or core module.
