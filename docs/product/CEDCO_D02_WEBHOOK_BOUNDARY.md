# CEDCO D02 Webhook Boundary

D02-AUTO-16 validates webhook behavior only through synthetic dialer-side fixtures. Platform remains
metadata-only and does not expose a public provider webhook.

## Current Boundary

| Control                     | State            |
| --------------------------- | ---------------- |
| Public webhook              | Not enabled      |
| Provider egress             | Disabled         |
| Live calls                  | Disabled         |
| Real provider payload       | Not processed    |
| Transcript/audio            | Not accessed     |
| Synthetic webhook rehearsal | Passed in dialer |

## Required Future Controls

A future private webhook staging loop must keep the same controls before any public route:

- HMAC or equivalent signature validation.
- Timestamp freshness.
- Replay protection.
- Idempotency key for every event.
- Metadata-only persistence.
- Transcript/audio/raw payload rejection or private quarantine.
- Sanitized evidence only.

Public webhook exposure requires a separate approval loop. That loop must define route exposure,
rollback, replay storage, idempotency persistence, rate limits, observability and incident owner.
