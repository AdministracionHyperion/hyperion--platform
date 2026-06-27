# Internal Dialer Adapter Contract

## Source

The platform contract is aligned with the sanitized dialer `main` documentation:

- `docs/HYPERION_INTERNAL_ENDPOINT_CONTRACT.md`.
- `docs/DRY_RUN_MODE.md`.
- `docs/IDEMPOTENCY_KEY_DESIGN.md`.
- `docs/HARDENING_P0_IMPLEMENTATION.md`.

Hyperion reads those documents as the source of truth. It does not copy dialer source code, import
dialer modules, call the VM, or target live dialer endpoints.

## Dry-Run Contract

Future dialer dry-run is represented by `POST /internal/hyperion/calls/dry-run` on the sanitized
dialer side. Hyperion models the same request/response contract without network access.

Required request fields:

- `Idempotency-Key` header or body `idempotency_key`.
- `safe_contact_ref`.
- `consent.granted=true`.
- `consent_ref`.

Safe response fields:

- `status=dry_run_accepted` for valid dry-run requests.
- `idempotency_key`.
- `internal_call_id`.
- `blocked_reasons`.
- `would_call_provider=false`.
- `provider_egress=false`.

## Dispatch Contract

Future live dispatch is represented by `POST /internal/hyperion/calls/dispatch`, but Hyperion keeps
it blocked. The platform adapter returns:

- `status=blocked`.
- `reason=live_dispatch_disabled`.
- `would_call_provider=false`.
- `provider_egress=false`.

There is no platform path that enables provider egress or real call dispatch in this loop.

## Forbidden Payload Fields

The adapter rejects these fields anywhere in payload metadata:

- `phone`, `phoneNumber`, `to_number`, `from_number`.
- `agent_id`, `phone_number_id`, real-looking provider identifiers.
- `rawTranscript`, `transcript`, `rawPayload`.
- `audioUrl`, `recordingUrl`, `audio_b64`.
- `token`, `secret`, `apiKey`, `api_key`, `password`.
- External callback URLs.

## Safety Invariants

- No HTTP client.
- No fetch, axios, got, node-fetch, or provider SDK.
- No direct `/api/demo/call` usage.
- No campaign start usage.
- No ElevenLabs, SIP, Twilio, Telnyx, Plivo, or Vonage usage.
- No VM access.
- No persisted phone numbers, transcripts, raw payloads, audio URLs, or secrets.

## CEDCO D02 Dry-Run E2E Coverage

CEDCO D02 now consumes this contract through a controlled product flow:

- Product endpoint: `POST /api/v1/tenants/:tenantId/products/cedco/d02/dialer/dry-run`.
- Domain use case: CEDCO D02 builds a safe intent and maps it to an internal dialer dry-run request.
- Composition: the API layer wires the CEDCO D02 port to `BlockedInternalDialerAdapter.dryRun`.
- Result: valid requests return `dry_run_accepted`, while `provider_egress=false` and
  `would_call_provider=false` remain invariant.

The CEDCO D02 module depends on a local port and does not import provider-adapter code directly.
This keeps product/domain boundaries intact while still proving the end-to-end dry-run contract.

Live dispatch remains blocked and has no D02 route.
