# CEDCO D02 Dialer Alignment

## Current State

CEDCO D02 is aligned to the sanitized dialer contract through `InternalDialerAdapter`. The current
platform behavior is contract-only and dry-run/blocked:

- Dry-run requests validate synthetic references only.
- Live dispatch is blocked with `live_dispatch_disabled`.
- Provider egress is always false.
- Real call execution is absent.
- D02 must not call dialer demo, campaign, ElevenLabs, SIP, or Twilio endpoints directly.

## Future Flow

When live calling is approved, D02 should still cross the integration boundary only through
`InternalDialerAdapter`.

Expected future path:

```text
CEDCO D02
  -> InternalDialerAdapter
    -> hardened internal dialer endpoint
      -> provider layer
```

## Required Before Live Calls

- Operational approval.
- Real auth.
- Persistent idempotency store.
- Dispatcher atomic claim wired and verified.
- Provider egress policy gate.
- Real-call policy gate.
- Rate limits.
- Audit and retention policy.
- Compliance review.
- Explicit go-live checklist.

Until those controls exist and are reviewed, D02 remains mock/dry-run only.
