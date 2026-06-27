# Voice Platform Boundaries

## Regla principal

Voice Platform es dominio y contratos. No es runtime telefonico, no es PBX, no es adapter de
proveedor y no contiene logica de producto.

## Dependencias permitidas

`modules/voice/*` puede depender de:

- `packages/shared`.
- `modules/core` para `OperationContext`, RBAC, audit, event bus y feedback.
- Tipos simples o referencias string hacia Agent Platform cuando representen versiones.

## Dependencias prohibidas

`modules/voice/*` no debe depender de:

- `modules/products`.
- `modules/integrations/provider-adapters`.
- Proveedores reales.
- SDKs de telefonia.
- SDKs de LLM.
- STT/TTS reales.
- WebSocket o sockets de red.
- `process.env`.
- `_private/`.

El boundary guard valida imports o usos de ElevenLabs, OpenAI, Anthropic, Twilio, Telnyx, Plivo,
Vonage, librerias SIP reales, `fetch`, `node:http`, `node:https`, `node:net`, `node:dgram`, `ws` y
nombres de adapter dentro de Voice.

## Proveedores reales

La decision SIP-first ya existe en ADRs previos: ruta futura principal `ElevenLabs + SIP Trunk`.
Este loop no implementa esa ruta.

El futuro `ElevenLabsSipTrunkAdapter` debe vivir en adapters o integrations, implementar
`CallProviderPort` y no filtrar IDs, telefonos, secretos ni payloads crudos al dominio.

## CEDCO D02

CEDCO D02 usara Voice Platform. Voice Platform no conoce CEDCO D02. Las politicas especificas de
campana, consentimiento o negocio se compondran encima de los contratos de Voice.

## Red y runtime

Voice Domain no abre puertos, no llama APIs, no usa sockets, no ejecuta llamadas y no procesa audio
real. Los fakes de `packages/testing/src/voice` son solo para pruebas unitarias.
