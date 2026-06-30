# CEDCO D02 Public Webhook Risk Boundary

## Scope

D02-AUTO-20 defined the public staging webhook exposure blueprint. D02-AUTO-21A exposed the Traefik
staging route, and D02-AUTO-22 connected real provider failure-event metadata only. Platform does
not process transcript/audio, does not enable provider egress, and does not enable live calls.

## Required Public Route Controls

- One exact webhook route only.
- TLS required before exposure.
- POST only.
- HMAC signature required.
- Timestamp freshness required.
- Replay protection required.
- Idempotency key required.
- Metadata-only sanitizer-first handling.
- No transcript/audio persistence.
- No raw provider payload persistence.
- Redacted metadata-only logs.
- Rate limit and body size limit.
- Rollback and kill switch verified before exposure.

## Platform Constraints

Platform must not use public webhook readiness as pilot readiness. Transcript QA, audio capture,
provider egress, live calls, and additional calls are separate gates.

## Future Gates

- Transcript QA: `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`.
- Audio capture: `APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`.
- Additional controlled call: `APPROVE_SINGLE_CONTROLLED_PILOT_CALL`.
