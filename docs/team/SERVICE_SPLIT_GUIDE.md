# Service Split Guide

## When To Propose A New Service

Propose a service split only when at least one strong reason exists:

- Different runtime.
- Different scaling profile.
- High operational risk.
- Sensitive provider integration.
- Distinct deployment cadence.
- Distinct owner.
- Security isolation requirement.
- Heavy asynchronous workload.

## Required Proposal

A service split proposal must include:

- Purpose.
- Owner.
- Data boundary.
- Contract.
- Versioning approach.
- Security baseline.
- CI/CD plan.
- Observability plan.
- Runbooks.
- Rollback plan.

## Do Not Split When

- Domain is unstable.
- Work is simple CRUD.
- Team cannot operate another service.
- Contract is not stable.
- Observability is not ready.

## Checks

Before opening a PR:

```bash
pnpm check
pnpm run repo:guard
pnpm db:schema:check
pnpm test
```

## Stop Conditions

Stop if the split requires secrets, live provider access, production deploy, VM changes, or direct
runtime execution without an approved runbook.
