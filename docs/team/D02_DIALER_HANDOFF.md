# D02 Dialer Handoff

## Current State

CEDCO D02 can run a controlled dry-run through the platform `InternalDialerAdapter` contract. The
flow validates safe contact references, idempotency, consent, forbidden payload fields, and safe
audit output.

This is not a live call path.

## Rules For Future Work

- Do not call the sanitized dialer directly from D02.
- Do not call `/api/demo/call` or campaign start endpoints.
- Do not call ElevenLabs, SIP, Twilio, Telnyx, Plivo, or Vonage from D02.
- Do not add phone numbers, provider IDs, raw transcripts, raw payloads, audio URLs, or secrets.
- Do not add a live dispatch route.
- Route all future dialer work through `InternalDialerAdapter`.

## Allowed Next Work

- Improve dry-run observability.
- Add a safe idempotency read model.
- Add more contract regression tests.
- Prepare approval/runbook checklists for a future live-dispatch loop.

## Still Blocked

- Live calls.
- Provider egress.
- VM access.
- Production deploy.
- D03 infrastructure changes.
