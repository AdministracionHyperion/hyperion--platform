# CEDCO D02 Pilot Security Gates

The D02 pilot remains NO-GO. D02-AUTO-16 proves synthetic webhook controls in the dialer repo, and
D02-AUTO-17 adds a private synthetic endpoint contract. Neither loop approves public webhook
exposure, real provider callbacks, or pilot traffic.

## Gates Before Pilot

- D02 Spanish controlled MVP evidence remains available.
- Provider egress and live calls remain disabled by default.
- Private webhook staging must pass with synthetic fixtures and remain non-public.
- Public webhook must remain blocked until separately approved.
- Real metadata-only provider webhook callbacks must remain blocked until separately approved.
- Transcript QA must remain blocked until separately approved.
- Audio capture/review must remain blocked until separately approved.
- Pilot scope, call count, numbers, operator, rate limits and stop owner must be approved.

## Required Future Approvals

- Transcript QA: `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`.
- Audio capture/review: `APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`.
- Public webhook: `APPROVE_PUBLIC_WEBHOOK_STAGING_EXPOSURE`.
- Real metadata-only webhook: `APPROVE_REAL_PROVIDER_WEBHOOK_METADATA_ONLY`.
- Pilot calls: a future exact approval phrase scoped to the pilot window and allowed numbers.

No platform feature should infer approval from the synthetic webhook rehearsal alone.
