# CEDCO D02 Webhook Boundary

D02-AUTO-16 validates webhook behavior through synthetic dialer-side fixtures. D02-AUTO-17 adds a
private dialer-side staging endpoint for synthetic signed payloads only. D02-AUTO-18B validates that
endpoint on the Contabo staging VM through loopback/internal access. D02-AUTO-21A exposes the public
Traefik staging route, and D02-AUTO-22 connects one real provider webhook for failure-event metadata
only.

## Current Boundary

| Control                     | State                       |
| --------------------------- | --------------------------- |
| Public webhook              | Enabled for staging route   |
| Provider egress             | Disabled                    |
| Live calls                  | Disabled                    |
| Real provider payload       | Not processed               |
| Transcript/audio            | Not accessed                |
| Synthetic webhook rehearsal | Passed in dialer            |
| Private synthetic endpoint  | Implemented in dialer       |
| VM private endpoint         | Passed                      |
| Provider capability review  | Completed                   |
| Real provider webhook       | Failure-event metadata only |

## Required Future Controls

A future private webhook staging loop must keep the same controls before any public route:

- HMAC or equivalent signature validation.
- Timestamp freshness.
- Replay protection.
- Idempotency key for every event.
- Metadata-only persistence.
- Transcript/audio/raw payload rejection or private quarantine.
- Sanitized evidence only.

Public webhook exposure was approved and executed in D02-AUTO-21A. Any further expansion must define
route exposure, rollback, replay storage, idempotency persistence, rate limits, observability and
incident owner.

D02-AUTO-22 limits real provider callbacks to the staging agent `call_initiation_failure` event.
Platform must continue to treat successful post-call transcript delivery, transcript QA, audio
capture, provider egress, live calls, and pilot traffic as blocked.
