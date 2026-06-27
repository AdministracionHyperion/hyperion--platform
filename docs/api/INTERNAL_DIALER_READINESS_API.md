# Internal Dialer Readiness API

The internal dialer API is a safe contract surface. It does not call the dialer, ElevenLabs, SIP,
Twilio or any external provider.

## Endpoints

- `GET /api/v1/tenants/:tenantId/integrations/internal-dialer/readiness` returns the P0 hardening
  checklist. Defaults are blocked and `p0Complete=false`.
- `POST /api/v1/tenants/:tenantId/integrations/internal-dialer/dry-run` validates a synthetic safe
  request through `BlockedInternalDialerAdapter`.

## Dry-Run Payload

Allowed fields:

- `idempotency_key` or `Idempotency-Key` header.
- `safe_contact_ref`.
- `agent_alias`.
- `caller_alias`.
- `consent.granted=true`.
- `consent_ref`.
- `dynamic_vars`.
- `metadata`.

Blocked fields include phone numbers, provider ids, raw transcripts, audio URLs, raw payloads,
tokens, secrets and external callback URLs.

The response exposes `would_call_provider=false` and `provider_egress=false`. The route never
dispatches calls and never targets `/api/demo/call` or campaign start endpoints.
