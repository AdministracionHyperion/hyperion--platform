# Dialer Hardening Backlog From Audit

## P0

- Idempotency key persistida.
- Dry-run real.
- Webhook signature obligatorio en prod.
- `AUTH_JWT_SECRET` obligatorio en prod.
- No raw transcript/audio/raw payload in `outcome_data`.
- Endpoint interno estable para Hyperion separado de demo/UI.
- No redial por pending contacts.
- Atomic mark attempted/processed.

## P1

- Redis rate limit.
- Retry/DLQ activo o removido del contrato.
- Dispatcher durable.
- Logs PII-safe.
- Retention policy.
- Secret manager.
- Admin-only DDI management.

## P2

- Distributed queue.
- Metricas refinadas.
- OpenTelemetry/exporters.
- Multi-tenant formal.
