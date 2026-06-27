# Dialer Service Evolution

## Current State

`hyperion-dialer-sanitized` is a sanitized/audited repository with:

- P0 hardening baseline.
- Idempotency contract.
- Internal dry-run endpoint.
- Live dispatch blocked.
- Webhook signature policy.
- Outcome sanitizer.
- PII-safe logging.

`hyperion--platform` has:

- `InternalDialerAdapter` contract aligned with sanitized dialer docs.
- Dialer readiness and dry-run surfaces.
- CEDCO D02 dry-run end-to-end flow.
- No live dispatch.
- No dialer network client.
- No VM access.

## Future State

The official execution service should be `hyperion-dialer-service`.

It should own:

- Hardened internal endpoints.
- Idempotency persistence.
- Atomic dispatcher claim.
- Provider execution.
- Webhook validation.
- Outcome sanitization.
- PII-safe logs.
- Execution telemetry.

## Migration Roadmap

- H1: P0 hardening baseline in sanitized dialer done.
- H2: Platform adapter alignment done.
- H3: D02 dry-run E2E done.
- H4: Dispatcher atomic claim wiring.
- H5: Idempotency persistence integration.
- H6: Internal endpoint staging contract.
- H7: Staging/sandbox deployment plan.
- H8: First controlled real call runbook.

## Rules

- No VM changes until a staging plan exists.
- No live dispatch until all gates are complete.
- No platform direct call to demo/campaign endpoints.
- No provider egress from platform.
- No secrets in repos.
- No copied dialer code in platform.

## H4 Preconditions

Before H4:

- Define execution service owner.
- Define idempotency persistence owner.
- Define dispatcher atomicity tests.
- Define rollback for failed dispatch preparation.
- Keep provider egress blocked.
