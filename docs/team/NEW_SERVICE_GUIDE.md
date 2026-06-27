# New Service Guide

## Purpose

Use this guide when proposing a service outside `hyperion--platform`, such as a future
`hyperion-dialer-service`.

## Required Before Repository Creation

- Service purpose.
- Owner.
- Contract.
- Data boundary.
- Security baseline.
- Deployment model.
- Observability model.
- Runbooks.
- Secret manager plan.
- CI/CD plan.

## Repository Rules

- Same GitHub organization.
- Branch protection from day one.
- Required CI checks.
- No secrets.
- No raw customer data.
- No production deploy until environment governance exists.

## Contract Rules

- Contract-first.
- Versioned.
- Compatibility tested.
- Tenant-scoped.
- Correlation ID required.
- Idempotency required for execution.
- No raw PII.

## Stop Conditions

Stop if service creation requires live provider egress, VM mutation, real secrets, or production
deploy without approved governance.
