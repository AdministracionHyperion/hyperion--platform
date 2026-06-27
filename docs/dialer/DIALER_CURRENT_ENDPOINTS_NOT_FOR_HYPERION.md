# Dialer Current Endpoints Not For Hyperion

Los endpoints actuales del dialer son referencia de auditoria, no contrato de Hyperion.

## Bloqueados

- `POST /api/demo/call`: puede disparar llamada real.
- `POST /api/campaigns/{campaign_id}/start`: inicia dispatcher y llamadas reales.
- `POST /webhooks/call-completed`: webhook real del dialer actual.
- `POST /webhooks/call-status`: webhook real del dialer actual.

## Razon

- El dry-run interno sanitized existe, pero los endpoints demo/campaign/webhook no son el contrato
  de Hyperion.
- Falta idempotencia persistida en llamada unitaria.
- Webhook signature puede depender de configuracion.
- Outcome data puede mezclar payload crudo.
- Rate limit y dispatcher actuales son in-memory.

Hyperion solo puede usar el contrato interno dry-run/blocked via `InternalDialerAdapter`. No debe
usar demo, campaign start ni webhooks reales.
