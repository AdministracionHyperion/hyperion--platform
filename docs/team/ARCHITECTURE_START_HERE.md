# Architecture Start Here

## What To Read First

1. `docs/enterprise-architecture/HYPERION_ENTERPRISE_ARCHITECTURE.md`.
2. `docs/enterprise-architecture/REPOSITORY_OPERATING_MODEL.md`.
3. `docs/enterprise-architecture/SERVICE_OPERATING_MODEL.md`.
4. `docs/enterprise-architecture/SECURITY_AND_SECRET_MANAGEMENT.md`.
5. `docs/enterprise-architecture/CI_CD_GOVERNANCE.md`.

## What You Can Touch

Touch only the paths assigned to your loop. For docs-only architecture work, stay in:

- `docs/enterprise-architecture/`.
- `docs/team/`.
- `docs/delivery/`.
- README/index docs.

## What Not To Touch

- Runtime code unless the loop explicitly says so.
- Prisma schema.
- VM or deployment files.
- Dialer sanitized repo.
- Secrets or environment files.
- Product verticals outside your scope.

## Checks

Run:

```bash
pnpm check
pnpm run repo:guard
pnpm db:schema:check
pnpm test
```

For D02 changes, also run:

```bash
pnpm evals:cedco-d02
pnpm test:evals
```

## PR Rules

- Branch from `main`.
- No direct push to `main`.
- No force push.
- Include safety notes.
- Include validation results.
- Stop if CI fails.
