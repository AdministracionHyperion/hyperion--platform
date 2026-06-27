# CEDCO D02 Vertical Boundaries

## Dependencias permitidas

`modules/products/cedco/d02-calls` puede depender de:

- `packages/shared`.
- `modules/core`.
- `modules/agent-platform`.
- `modules/voice`.

## Dependencias prohibidas

CEDCO D02 no depende de:

- Provider adapters.
- ElevenLabs.
- Twilio.
- OpenAI.
- Anthropic.
- Telnyx.
- Plivo.
- Vonage.
- Librerias SIP reales.
- `node:http`, `node:https`, `node:net`, `node:dgram`, `ws` o `fetch`.
- `process.env`.
- `_private/`.
- Filesystem para leer documentos reales.

## Fuera de alcance

CEDCO D02 no implementa R03 ni activos fijos. Tampoco implementa PBX, inbound, llamadas reales,
persistencia, API HTTP ni runtime.

## Ruta futura

La ruta futura de salida sigue siendo Hyperion Control Plane, ElevenLabs Managed Voice Runtime y SIP
Trunk. Esa integracion debe vivir fuera del dominio vertical.
