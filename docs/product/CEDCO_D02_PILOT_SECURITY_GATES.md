# CEDCO D02 Pilot Security Gates

The D02 pilot remains NO-GO. D02-AUTO-16 only proves synthetic webhook controls in the dialer repo.

## Gates Before Pilot

- D02 Spanish controlled MVP evidence remains available.
- Provider egress and live calls remain disabled by default.
- Private webhook staging must pass with synthetic fixtures.
- Public webhook must remain blocked until separately approved.
- Transcript QA must remain blocked until separately approved.
- Audio capture/review must remain blocked until separately approved.
- Pilot scope, call count, numbers, operator, rate limits and stop owner must be approved.

## Required Future Approvals

- Transcript QA: `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`.
- Audio capture/review: `APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`.
- Public webhook: a future exact approval phrase scoped to route exposure and rollback.
- Pilot calls: a future exact approval phrase scoped to the pilot window and allowed numbers.

No platform feature should infer approval from the synthetic webhook rehearsal alone.
