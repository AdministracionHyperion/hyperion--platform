# Observability Security Baseline

Observability must not become a second persistence layer for sensitive data.

## Redaction

`sanitizeLogMetadata` redacts sensitive keys including phone fields, email, document identifiers,
passwords, secrets, tokens, API keys, raw transcripts, audio URLs, recording URLs, authorization and
cookies. Nested plain objects and arrays are sanitized recursively.

This loop does not attempt free-text PII detection. Text content must already be redacted by the
domain/API contract before it reaches logs.

## Logging Rules

- No raw request body logging.
- No authorization or cookie logging.
- No raw transcript logging.
- No raw audio or recording URL logging.
- No provider credentials.
- No real patient records.
- No stack traces in API responses.

## Audit Rules

Audit events require tenant, actor and correlation context for protected routes. Audit metadata is
sanitized before in-memory storage or Prisma persistence. Public health/version routes are not
audited.

## Production Gaps

External telemetry, retention policies, log access controls, encryption, alerting and export
pipelines remain future production work. Any future exporter must be added behind a port and pass
the same redaction guarantees.
