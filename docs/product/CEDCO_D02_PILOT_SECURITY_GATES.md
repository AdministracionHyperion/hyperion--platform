# CEDCO D02 Pilot Security Gates

The D02 pilot remains NO-GO. D02-AUTO-16 proves synthetic webhook controls in the dialer repo,
D02-AUTO-17 adds a private synthetic endpoint contract, and D02-AUTO-18B validates that endpoint on
the Contabo staging VM through loopback/internal access. These loops do not approve public webhook
exposure, real provider callbacks, or pilot traffic.

## D02-AUTO-19 Update

Real provider webhook metadata-only staging remains blocked. The current validated webhook path is
synthetic loopback/internal only. Public exposure and real provider callbacks require separate
approval and design review before pilot traffic can be considered.

## D02-AUTO-20 Update

Public webhook exposure remains inactive. The new blueprint defines route, TLS, POST-only, HMAC,
replay, idempotency, sanitizer, metadata-only, logging, rate-limit, rollback and kill-switch
requirements, but does not expose a route or connect the provider.

## Gates Before Pilot

- D02 Spanish controlled MVP evidence remains available.
- Provider egress and live calls remain disabled by default.
- Private webhook staging must pass with synthetic fixtures and remain non-public. Loopback/internal
  synthetic VM validation is complete.
- Public webhook must remain blocked until separately approved.
- Real metadata-only provider webhook callbacks must remain blocked until separately approved.
- Public webhook route templates must remain non-applied until separately approved.
- Transcript QA must remain blocked until separately approved.
- Audio capture/review must remain blocked until separately approved.
- Pilot scope, call count, numbers, operator, rate limits and stop owner must be approved.

## Required Future Approvals

- Transcript QA: `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`.
- Audio capture/review: `APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`.
- Public webhook: `APPROVE_PUBLIC_WEBHOOK_STAGING_EXPOSURE`.
- Real metadata-only webhook staging: `APPROVE_REAL_PROVIDER_WEBHOOK_METADATA_ONLY`.
- Pilot calls: `APPROVE_SINGLE_CONTROLLED_PILOT_CALL` scoped to the pilot window and allowed
  numbers.

No platform feature should infer approval from the synthetic webhook rehearsal alone.
