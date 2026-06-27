# Dialer Current Endpoints Not For Hyperion

Los endpoints actuales del dialer son referencia de auditoria, no contrato de Hyperion.

## Bloqueados

- `POST /api/demo/call`: puede disparar llamada real.
- `POST /api/campaigns/{campaign_id}/start`: inicia dispatcher y llamadas reales.
- `POST /webhooks/call-completed`: webhook real del dialer actual.
- `POST /webhooks/call-status`: webhook real del dialer actual.

## Razon

- No hay dry-run real.
- Falta idempotencia persistida en llamada unitaria.
- Webhook signature puede depender de configuracion.
- Outcome data puede mezclar payload crudo.
- Rate limit y dispatcher actuales son in-memory.

Hyperion solo puede usar contratos mock/dry-run seguros hasta que exista endpoint interno hardened.
