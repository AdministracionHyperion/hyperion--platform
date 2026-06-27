# CEDCO D03 Vertical Boundaries

## Permitido

- `packages/shared`.
- `modules/core`.
- `packages/testing`.
- `packages/db` solo en loops futuros coordinados.

## Prohibido

- `modules/products/cedco/d02-calls`.
- `modules/voice`.
- `modules/voice/call-runtime`.
- `modules/voice/provider-events`.
- `modules/integrations/provider-adapters`.
- ElevenLabs.
- SIP.
- Twilio.
- OpenAI.
- Anthropic.
- Dialer.
- PBX.
- Routes D02.
- Workers D02.
- Evals D02.
- Dashboard D02.

## Estado

El carril `modules/products/cedco/d03-fixed-assets` ya contiene domain contracts iniciales: value
objects, entidades, policies, ports, use cases y testing utilities.

Siguen pendientes DB, migraciones Prisma, API, dashboard, workers, import/export real y cualquier
integracion productiva.
