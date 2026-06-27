# Module Boundaries

## Reglas base

- `core` no depende de `products`.
- `agent-platform` no depende de CEDCO.
- `voice` no depende de CEDCO.
- `products/cedco/d02-calls` puede depender de `core`, `agent-platform` y `voice`.
- `integrations/provider-adapters` no debe contaminar dominio.
- ElevenLabs no se importa en dominio.
- SIP-first esta documentado, pero no implementado todavia.

## Direccion de dependencias

```text
apps
  -> products
  -> voice
  -> agent-platform
  -> core
  -> packages/shared
```

Las integraciones se consumen mediante puertos internos. Un adapter externo puede implementar un
puerto, pero no cambiar el lenguaje del dominio.

## Core

`core` contiene capacidades transversales:

- Tenancy.
- Identity and access.
- Audit.
- Event bus.
- Feature flags.
- Versioning.
- Feedback.

`core` no conoce CEDCO, ElevenLabs, SIP trunk, Twilio, PBX ni casos de uso de cliente.

## Agent Platform

`agent-platform` contiene capacidades reutilizables para agentes:

- Agent builder.
- Prompt management.
- Flow management.
- Knowledge/RAG.
- Evals.

No debe importar desde `modules/products/cedco/*`.

## Voice

`voice` contiene lenguaje comun del dominio de voz:

- Voice core.
- Call orchestration.
- Telephony.
- Speech.
- Handoff.

`voice` puede definir puertos como `CallProviderPort` en loops posteriores, pero no debe importar
SDKs ni APIs directas de ElevenLabs, Twilio o PBX.

## Integrations

`integrations` contiene bordes de mundo externo:

- Scheduling.
- EPS eligibility.
- CRM.
- Documents.
- Provider adapters.

`provider-adapters` es donde viviran adapters futuros como `MockCallProviderAdapter`,
`ElevenLabsSipTrunkAdapter`, `TwilioAdapter`, `OwnTelephonyGatewayAdapter` o `PbxInboundAdapter`. En
este loop no se implementa ninguno.

## Products

`products/cedco/d02-calls` compone capacidades existentes para el vertical CEDCO D02 llamadas. Puede
depender de modulos transversales, pero no debe introducir dependencias inversas hacia `core`,
`agent-platform` o `voice`.

## Proveedores de llamada

La arquitectura SIP-first ya esta aceptada:

- Hyperion = control plane.
- ElevenLabs = managed voice runtime futuro.
- SIP trunk / proveedor DID = numeros, DIDs y transporte telefonico futuro.
- PBX propio = fuera de fase 1.

La implementacion se hara despues de dominio, contratos, persistencia, seguridad y observabilidad.
