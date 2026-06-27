# Provider Event Ingestion

This loop adds a safe mock-only provider event ingestion contract for Hyperion Voice.

## Contracts

- `ProviderEventEnvelope` describes a received mock event after headers and payload have been
  sanitized.
- `ProviderEventSource` includes `mock` plus future placeholders that remain blocked.
- `ProviderEventSignatureVerifierPort` verifies synthetic test signatures only.
- `ReplayProtectionPort` prevents duplicate event processing with an in-memory store.
- `SanitizedProviderEvent` is the only event shape that downstream workers and product logic
  consume.

## Flow

1. API receives `POST /api/v1/tenants/:tenantId/voice/mock-provider-events`.
2. Request context provides tenant, actor, roles, and correlation ID.
3. `x-hyperion-mock-signature` must equal the synthetic test value.
4. Replay protection checks `source:eventId`.
5. Payload and headers are sanitized.
6. The mock normalizer creates `SanitizedProviderEvent`.
7. Audit, metrics, and logs are recorded with safe metadata.

No raw payload, raw transcript, audio URL, phone, email, document number, token, secret, or password
is persisted.

## Future Providers

Real provider webhook routes and adapters remain out of scope. Future provider sources are
documented placeholders only and are blocked by policy until a later adapter loop defines secret
manager, runbook, replay, HMAC, and production controls.
