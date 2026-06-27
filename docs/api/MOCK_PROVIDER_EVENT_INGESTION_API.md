# Mock Provider Event Ingestion API

## Endpoint

`POST /api/v1/tenants/:tenantId/voice/mock-provider-events`

Required headers:

- `x-actor-id`
- `x-actor-roles`
- `x-correlation-id`
- `x-hyperion-mock-signature: mock_valid_signature`

Allowed payload fields:

- `eventId`
- `source: mock`
- `type: provider.mock.*`
- `providerCallRef` with `mock_call_` prefix
- `occurredAt`
- `safeSummary`
- `safeIntent`
- `disposition`
- `handoffRecommended`
- sanitized `metadata`

Blocked payload fields include raw payload, raw transcript, transcript, audio URL, recording URL,
phone, email, document number, token, API key, secret, and password.

Responses use the standard API envelope with `correlationId`. Replay returns a conflict response.
Signature failures return a policy blocked response. The API never returns raw payload.
