# New Product Vertical Guide

## Required Starting Documents

Before code:

- Product scope.
- Vertical boundaries.
- Security baseline.
- Domain roadmap.
- Delivery roadmap.
- Testing plan.

## Allowed First Loop

The first loop for a new product should usually create:

- Domain contracts.
- Value objects.
- Policies.
- Use cases.
- Testing fakes.
- Unit tests.
- Docs.

Do not start with DB, API, dashboard, workers, imports, exports, or deployment.

## Isolation Rules

- Do not import other product verticals directly.
- Do not import provider SDKs.
- Do not read `process.env` from domain code.
- Do not use real customer data.
- Do not introduce secrets.

## PR Checklist

- Scope is product-specific.
- Boundaries are documented.
- Security baseline exists.
- Repo guard and architecture checks pass.
- CI is green.
