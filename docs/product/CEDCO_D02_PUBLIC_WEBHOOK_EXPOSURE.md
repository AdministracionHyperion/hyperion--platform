# CEDCO D02 Public Webhook Exposure

## D02-AUTO-21A State

The D02 public staging webhook route is active through Traefik for synthetic signed payloads only.

This does not connect ElevenLabs, does not approve real provider callbacks, does not enable provider
egress, and does not enable live calls.

## D02-AUTO-22 Update

D02-AUTO-22 connected real provider failure-event metadata only through the staging agent override.
This does not enable provider egress, live calls, transcript QA, audio access, or pilot traffic.

## Product Boundary

Platform may treat this as infrastructure readiness for a future metadata-only provider webhook
gate. Platform must not treat it as pilot readiness.

The following remain blocked:

- successful post-call transcript delivery;
- transcript QA;
- audio capture or review;
- provider egress for calls;
- live calls;
- pilot traffic.

## Validation Summary

Synthetic validation proved that the public route rejects wrong paths, unsigned requests, invalid
signatures, replayed events, idempotency conflicts, transcript/audio fields, PII-like fields, and
oversized bodies.

Rollback was validated by disabling the route and confirming a signed POST no longer reached the
endpoint. The route was then restored for the approved synthetic staging state.

## Next Gate

Next provider work must define durable metadata-only event handling and pilot readiness without
enabling transcript/audio or provider egress.
