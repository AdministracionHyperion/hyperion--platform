# Observability Architecture

Hyperion now has a local observability layer for API and future worker/runtime code. The layer is
implemented as ports and in-memory implementations, so it can be replaced later by production
exporters without coupling domains to a vendor.

## Package

`packages/observability` provides:

- `LoggerPort` with `debug`, `info`, `warn` and `error`.
- `InMemoryLogger` for tests.
- `ConsoleLogger` for future manual runtime use.
- Central redaction through `sanitizeLogMetadata`.
- `InMemoryMetricsRegistry` for counters and duration observations.
- `Timer` helpers for request duration.
- `ObservabilityContext` for tenant, actor and correlation data.

No external APM package, exporter or service is installed in this loop.

## API Hooks

`apps/api/src/observability` registers Fastify hooks for:

- request completion logging;
- request duration metrics;
- HTTP status and error counters;
- CEDCO D02 and Voice route counters;
- protected-route audit events.

`createApiApp` still receives dependencies by injection. The app does not create a Prisma client,
does not open ports and does not send telemetry externally.

## Audit Integration

Protected API requests create conceptual audit events with `tenantId`, `actorId`, `correlationId`,
action, resource and result. With `PrismaBackedApiServices`, the audit hook persists sanitized audit
events through the existing Prisma audit log model. With fake services, audit events remain
inspectable in memory.

Public routes such as `/health` and `/api/v1/version` are not audited.

## Boundaries

Observability may depend on shared sanitization concepts but not on products or providers. It does
not import ElevenLabs, Twilio, OpenAI, Anthropic, Sentry, Datadog, NewRelic or OpenTelemetry
exporters. Future production telemetry must be added behind ports and guarded by explicit security
review.
