# CEDCO D02 Public Webhook Risk Boundary

## Scope

D02-AUTO-20 defines a future public staging webhook exposure blueprint. Platform does not expose a
public route, does not connect a real provider webhook, does not process real provider payloads, and
does not enable provider egress or live calls.

## Required Future Public Route Controls

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

Platform must not use public webhook readiness as pilot readiness. Public exposure, real provider
callback configuration, transcript QA, audio capture, and additional calls are separate gates.

## Future Gates

- Public staging exposure: `APPROVE_PUBLIC_WEBHOOK_STAGING_EXPOSURE`.
- Real provider metadata-only webhook: `APPROVE_REAL_PROVIDER_WEBHOOK_METADATA_ONLY`.
- Transcript QA: `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`.
- Audio capture: `APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`.
- Additional controlled call: `APPROVE_SINGLE_CONTROLLED_PILOT_CALL`.
