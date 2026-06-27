# API Policy Gates

The API registers a security plugin before route handlers. It applies rate limits and runtime
blockers using injected services, not global state.

## Behavior

- Dangerous runtime flags return `policy_blocked` with HTTP 403.
- Sensitive payload fields return `validation_error` with HTTP 400.
- Rate limit failures return `rate_limit_exceeded` with HTTP 429.
- Response envelopes keep `correlationId`.
- Logs and audit metadata are sanitized.

## CEDCO D02

`realCallsEnabled=true`, `schedulingMode=integration` and `eligibilityMode=integration` are blocked
in configuration updates in this loop. No call dispatch route or provider egress route is created.

## Observability

Denied gates increment policy and runtime blocker metrics, write sanitized logs and persist audit
failures when Prisma-backed services are injected.
