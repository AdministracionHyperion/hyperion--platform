# CEDCO D02 Pilot Security Gates

The D02 pilot remains NO-GO. D02-AUTO-16 proves synthetic webhook controls in the dialer repo,
D02-AUTO-17 adds a private synthetic endpoint contract, and D02-AUTO-18B validates that endpoint on
the Contabo staging VM through loopback/internal access. D02-AUTO-21A exposes a Traefik public
route, D02-AUTO-22 connects failure-event provider metadata only, and D02-AUTO-23 adds durable
metadata-only handling for that event. These loops do not approve pilot traffic.

## D02-AUTO-19 Update

Real provider webhook metadata-only staging remains blocked. The current validated webhook path is
synthetic loopback/internal only. Public exposure and real provider callbacks require separate
approval and design review before pilot traffic can be considered.

## D02-AUTO-20 Update

Public webhook exposure was inactive in D02-AUTO-20. The blueprint defined route, TLS, POST-only,
HMAC, replay, idempotency, sanitizer, metadata-only, logging, rate-limit, rollback and kill-switch
requirements, but did not expose a route or connect the provider.

## D02-AUTO-21A Update

Public webhook exposure is active through Traefik. Wrong webhook paths, unsigned requests, invalid
signatures, replayed events, idempotency conflicts, transcript and audio fields, PII/provider IDs,
and oversized bodies were rejected or stripped as expected.

Real provider webhook remained disconnected during D02-AUTO-21A.

## D02-AUTO-22 Update

The real-provider webhook approval phrase was received. One real provider webhook is now attached
through the staging agent override for `call_initiation_failure` only. The webhook secret is
VM-only. No real provider payload, transcript, audio, call, provider egress, or live dispatch was
used.

## D02-AUTO-23 Update

Durable metadata-only handling for `call_initiation_failure` is implemented and validated with
synthetic signed payloads. The dialer persists sanitized metadata and hashes only, handles replay
and idempotency conflicts, and creates an audit record.

No pilot traffic, transcript QA, audio access, raw provider payload persistence, campaign, batch, or
automatic retry is approved.

## Gates Before Pilot

- D02 Spanish controlled MVP evidence remains available.
- Provider egress and live calls remain disabled by default.
- Private webhook staging must pass with synthetic fixtures and remain non-public. Loopback/internal
  synthetic VM validation is complete.
- Real provider webhook handling is limited to durable failure-event metadata; it does not authorize
  successful post-call transcript handling or pilot traffic.
- Public webhook route must remain on the approved staging path only.
- Transcript QA must remain blocked until separately approved.
- Audio capture/review must remain blocked until separately approved.
- Pilot scope, call count, numbers, operator, rate limits and stop owner must be approved.

## Required Future Approvals

- Transcript QA: `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`.
- Audio capture/review: `APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`.
- Pilot metadata call: `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL` scoped to one allowed
  controlled number and one call.

No platform feature should infer approval from the synthetic webhook rehearsal alone.
