# ADR-0004: CallProviderPort y adapters

## Estado

Aceptado como contrato conceptual. No crear codigo TypeScript en este loop.

## Decision

El dominio de Hyperion dependera de un puerto interno llamado `CallProviderPort`.

El dominio no debe importar SDKs, clientes HTTP ni tipos propios de ElevenLabs, Twilio, PBX o gateways telefonicos externos.

## Contrato conceptual

`CallProviderPort` expone las siguientes operaciones conceptuales:

- `prepareOutboundCall`: validar configuracion de proveedor, mapear referencias internas y construir un plan de dispatch sin enviar la llamada.
- `dispatchOutboundCall`: enviar la llamada outbound al proveedor autorizado en runtime.
- `cancelOutboundCall`: cancelar una llamada aun no completada cuando el proveedor y el estado lo permitan.
- `ingestProviderEvent`: recibir eventos operativos del proveedor durante el lifecycle.
- `ingestPostCallWebhook`: recibir webhooks post-call, validar autenticidad, sanitizar payload y convertirlo a eventos internos.

## Adapters previstos

- `MockCallProviderAdapter`: desarrollo local y pruebas sin egress real. Permitido desde el inicio.
- `ElevenLabsSipTrunkAdapter`: primer adapter real planeado para fase 1. No se implementa en este loop.
- `TwilioAdapter`: futuro opcional como fallback.
- `OwnTelephonyGatewayAdapter`: futuro para gateway propio.
- `PbxInboundAdapter`: futuro para inbound, IVR interno, colas y redireccion a humanos.

## Reglas del puerto

- La entrada del dominio usa `tenantId`, `correlationId`, `calleeAlias`, proposito, referencias de campaña y versiones activas.
- `to_number` se resuelve solo en runtime mediante `ContactResolver`.
- `to_number` solo se entrega al proveedor al momento de dispatch y no se persiste en claro.
- La salida del adapter debe convertir `conversation_id` y `sip_call_id` a referencias sanitizadas.
- Ningun adapter puede persistir raw transcript, audio crudo, secretos o PII innecesaria por defecto.

## Consecuencias

- La arquitectura permite evolucionar de mock a ElevenLabs sin cambiar reglas de dominio.
- Las integraciones reales entran despues de dominio, contratos, persistencia, seguridad y observabilidad.
