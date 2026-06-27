# Security and Secret Management

## Repository Policy

Repositories must not contain:

- `.env` files.
- Secret values.
- API keys.
- Provider tokens.
- Real phone numbers.
- Raw logs.
- Audio.
- Transcripts.
- Database dumps.
- Certificates or backups.

Examples may reference variable names without values.

## Secret Manager

Future production and staging environments must use a managed secret store.

Code should use references such as:

- `secretManagerRef`.
- `providerConfigRef`.
- `AUTH_PROVIDER_REF`.
- `AUTH_JWKS_URL` as a reference to public key discovery, not a secret value.

Provider credentials are injected only at runtime by the deployment plane.

## PII Policy

Use safe references instead of raw data:

- `safeContactRef` instead of phone number.
- `patientContextRef` instead of clinical data.
- `consentRef` instead of raw consent documents.
- `providerCallRef` only if synthetic or safe.

Raw transcript and raw audio are blocked by default.

## Runtime Security

Production requires:

- Real auth mode.
- Secret manager.
- Policy gates.
- Runtime blockers.
- Rate limits.
- Audit.
- Observability.
- Replay protection for webhooks.
- Idempotency for execution requests.

## Webhook Security

Webhook-like ingestion requires:

- Signature verification.
- Replay protection.
- Payload size limits.
- Sanitization.
- No raw payload persistence.
- Safe audit metadata.

## Provider Egress

Provider egress is denied by default. Enabling it requires:

- Explicit flag.
- Approval.
- Runbook.
- Provider config reference.
- Secret manager reference.
- Audit.
- Monitoring.
- Rollback plan.
