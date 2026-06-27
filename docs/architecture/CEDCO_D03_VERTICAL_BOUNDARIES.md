# CEDCO D03 Vertical Boundaries

## Permitido

- `packages/shared` cuando exista.
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
- Workers D02.
- Routes D02.
- Evals D02.
- Dashboard D02.

## Estado

El carril `modules/products/cedco/d03-fixed-assets` existe solo para handoff. No contiene entidades,
use cases, DB, API ni dashboard funcional.
