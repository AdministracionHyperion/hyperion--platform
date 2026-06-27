# Mock Call Runtime

El mock call runtime permite validar el flujo end-to-end de CEDCO D02 sin llamadas reales.

## Proposito

Existe antes de ElevenLabs/SIP para probar integracion de dominio, API, workers, persistencia,
audit, metricas y logs con datos sinteticos.

## Estados

- `pending`
- `ready`
- `running`
- `completed`
- `failed`
- `blocked`
- `cancelled`

## Eventos sinteticos

- `call.mock.started`
- `call.mock.agent_prompted`
- `call.mock.user_intent_detected`
- `call.mock.completed`

## Limites

- No abre red.
- No usa proveedor real.
- No usa numeros reales.
- No guarda raw transcript.
- No guarda audio URL.
- No usa agent id ni phone number id reales.
- No reemplaza smoke test real.

## Futuro

El adapter real de proveedor solo debe entrar despues de runbooks, secret manager, approvals, policy
gates y pruebas de integracion dedicadas.
