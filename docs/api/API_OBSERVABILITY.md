# API Observability

The API registers observability hooks during `createApiApp`. Tests use `Fastify.inject`, so request
logging, metrics and audit behavior are exercised without `server.listen`.

## Request Logging

Each request records a structured log entry with method, route, status code, duration and
correlation data. The logger does not record raw request bodies or sensitive headers. Any metadata
that reaches logs is sanitized first.

Sensitive header names such as `authorization`, `cookie` and `set-cookie` are redacted if they are
ever passed as metadata.

## Correlation

The API preserves `x-correlation-id` when supplied. If missing, it generates a local correlation id
and returns it in the response envelope. Logs, metrics labels and audit events use the same
correlation id.

## Metrics

The in-memory metrics registry records:

- `http_requests_total`;
- `http_request_errors_total`;
- `http_request_duration_ms`;
- `audit_events_total`;
- `validation_errors_total`;
- `forbidden_requests_total`;
- `cedco_d02_requests_total`;
- `voice_call_contract_requests_total`;
- `provider_blocked_requests_total`.

There is no public metrics endpoint and no external exporter in this loop.

## Audit

Protected routes emit sanitized audit events. The Prisma-backed service persists them to `AuditLog`;
fake services keep them in memory. Public health and version routes are intentionally excluded.

## Errors

Validation, authorization and internal errors are logged with safe metadata. Responses never include
stack traces.
