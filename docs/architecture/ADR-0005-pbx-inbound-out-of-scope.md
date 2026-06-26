# ADR-0005: PBX inbound fuera de alcance

## Estado

Aceptado.

## Decision

PBX propio queda fuera de fase 1 para CEDCO D02.

## Razonamiento

D02 outbound puede avanzar con Hyperion como control plane, ElevenLabs como managed voice runtime y
un SIP trunk/proveedor DID para numeros y transporte.

Construir o integrar un PBX propio en fase 1 agregaria superficie operativa no necesaria para
validar el primer flujo outbound controlado.

## Uso futuro del PBX

PBX propio servira despues para:

- Inbound.
- IVR interno.
- Colas.
- Redireccion a humano.
- Reglas de transferencia.
- Gestion interna de telefonia.

## Consecuencias

- No se bloquea D02 outbound por PBX.
- No se usa FreeSWITCH, Kamailio ni Asterisk en esta fase.
- No se implementan llamadas entrantes en este loop.
- `PbxInboundAdapter` queda documentado como adapter futuro.
