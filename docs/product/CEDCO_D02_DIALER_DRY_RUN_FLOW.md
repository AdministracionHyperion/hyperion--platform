# CEDCO D02 Dialer Dry-Run Flow

## Purpose

This flow proves that CEDCO D02 can prepare a safe outbound-call intent and validate it against the
`InternalDialerAdapter` contract without touching the dialer VM, provider network, or any live call
runtime.

The flow is dry-run only. It does not call ElevenLabs, SIP, Twilio, the sanitized dialer, or any
external service.

## Flow

1. API receives a CEDCO D02 dry-run request with tenant, actor, correlation, `safe_contact_ref`,
   `consent.granted=true`, `consent_ref`, and an idempotency key.
2. CEDCO D02 builds a safe call intent.
3. The intent is transformed into an internal dialer dry-run request.
4. The local `InternalDialerAdapter` validates idempotency, consent, and safe contact references.
5. The adapter returns `dry_run_accepted` for safe requests.
6. The response always includes `provider_egress=false` and `would_call_provider=false`.
7. CEDCO D02 records sanitized audit and metrics events.

## API Surface

`POST /api/v1/tenants/:tenantId/products/cedco/d02/dialer/dry-run`

Allowed request fields:

- `idempotency_key` or `Idempotency-Key` header.
- `safe_contact_ref`.
- `consent.granted`.
- `consent_ref`.
- safe CEDCO references such as `patient_context_ref`, `cedco_site_id`, `service_id`, and
  `agreement_id`.
- allowlisted metadata only.

Forbidden fields include phone numbers, provider identifiers, raw transcript, raw payload, audio
URLs, tokens, secrets, passwords, and external callback material.

## Safety Invariants

- No VM access.
- No HTTP client.
- No provider SDK.
- No live dispatch.
- No phone number.
- No raw transcript, raw payload, or audio URL.
- No secrets.
- No D03 infrastructure.

Live dispatch remains blocked by the internal dialer contract and is not exposed from D02.
