# Observability and Operability

## Logging

Logs must be structured and redacted.

Required fields:

- `tenantId` when available.
- `actorId` or service principal reference when available.
- `correlationId`.
- action/event name.
- safe metadata.

Logs must not contain raw PII, phone numbers, transcripts, audio URLs, raw payloads, or secrets.

## Metrics

Metrics should cover:

- API requests.
- Policy denials.
- Rate-limit denials.
- Worker jobs.
- Dry-run outcomes.
- Mock runtime outcomes.
- Provider event ingestion outcomes.
- Future execution service status.

## Audit

Audit events are the system of record for sensitive product actions. Audit metadata must be
sanitized and tenant-scoped.

Sensitive workflows need:

- Requested event.
- Accepted/blocked event.
- Actor.
- Correlation ID.
- Safe resource ID.
- Blocked reasons.

## Dashboards

Dashboards are read-only unless an explicit action-control model exists. Operational dashboards
should show:

- Health.
- Recent audit events.
- Metrics.
- Policy gate denials.
- Runtime safety flags.
- Eval summaries.
- Execution plane readiness.

## Alerts

Future alerts should cover:

- CI failures.
- Policy denial spikes.
- Provider error spikes.
- Replay attempts.
- Webhook signature failures.
- DLQ growth.
- Missing audit events.
- Latency or error budget burn.

## Runbooks

Runbooks are required before production execution. They should include:

- Preconditions.
- Rollback.
- Verification.
- Contacts.
- Safety gates.
- Known failure modes.

## Future SLO/SLA

SLOs should be introduced after staging telemetry is available. Early candidates:

- API availability.
- Internal dry-run latency.
- Provider event ingestion latency.
- Audit write success.
- Worker processing latency.
