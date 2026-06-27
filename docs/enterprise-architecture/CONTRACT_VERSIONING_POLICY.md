# Contract Versioning Policy

## Contract Types

Hyperion should use:

- OpenAPI for HTTP APIs.
- JSON Schema for request/response payloads.
- AsyncAPI or equivalent event specs when event surfaces become formal.
- TypeScript domain contracts inside a repo, not as cross-service truth.

## Versioning

Use semantic versioning for service contracts:

- Major: breaking changes.
- Minor: backward-compatible additions.
- Patch: clarifications and non-breaking fixes.

Every cross-service contract needs a version, owner, changelog, and compatibility tests.

## Compatibility

Required controls:

- Consumer-driven contract tests.
- Provider contract tests.
- Backward-compatible schema evolution.
- Explicit deprecation windows.
- CI that fails on incompatible changes.

## Envelope Requirements

Every cross-service request/event should include:

- `tenantId`.
- `correlationId`.
- idempotency key where mutation or execution can repeat.
- actor or service principal reference.
- action or event type.
- sanitized metadata.
- audit-relevant timestamps.

## Data Safety

Contracts must not include:

- Raw PII.
- Raw transcript.
- Raw audio.
- Raw payload.
- Real provider IDs as platform-owned fields.
- Secrets.
- API keys.
- Provider tokens.

Use safe references:

- `safeContactRef` instead of phone number.
- `providerConfigRef` instead of provider credential values.
- `secretManagerRef` instead of secret values.
- `patientContextRef` instead of clinical history.

## Deprecation Policy

Breaking changes require:

- Migration plan.
- Dual-read or dual-write strategy if needed.
- Consumer notice.
- Contract tests for old and new behavior during transition.
- Removal date.
