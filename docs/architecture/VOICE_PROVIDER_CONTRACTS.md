# Voice Provider Contracts

## CallProviderPort

`CallProviderPort` define el contrato minimo para proveedores de llamada:

- `prepareOutboundCall`.
- `dispatchOutboundCall`.
- `cancelOutboundCall`.
- `ingestProviderEvent`.
- `ingestPostCallWebhook`.

El dominio solo conoce este puerto. No importa SDKs de proveedores.

## ContactResolverPort

`ContactResolverPort` resuelve `calleeAlias` a un target runtime. El resultado contiene un numero
E.164 solo en memoria de ejecucion y marcado como no persistible.

Regla:

- `calleeAlias` se puede persistir.
- `callerAlias` se puede persistir.
- El E.164 real se entrega al adapter/proveedor solo en runtime.
- El E.164 real no se guarda en `CallSession`, `CallEvent`, metadata ni audit log.

## ProviderCallReference

`ProviderCallReference` guarda:

- `providerName`.
- `providerCallId` sanitizado.
- Metadata sanitizada opcional.

No guarda `to_number`, `from_number`, telefonos reales, secretos ni payloads crudos.

## PostCallWebhookEnvelope

`PostCallWebhookEnvelope` representa un webhook post-call ya recibido:

- `providerName`.
- `providerEventId`.
- `ProviderCallReference`.
- `callId` opcional.
- `receivedAt`.
- `signatureVerified`.
- `payloadMetadata` sanitizada.

El dominio exige `signatureVerified=true` antes de ingerir resultado post-call. La validacion HMAC
real pertenece al adapter o capa de seguridad HTTP futura.

## Futura implementacion ElevenLabsSipTrunkAdapter

La ruta futura principal sera `ElevenLabs + SIP Trunk`.

El adapter debera:

- Implementar `CallProviderPort`.
- Vivir fuera de `modules/voice`.
- Construir requests del proveedor con datos de runtime.
- Enviar al proveedor solo los datos minimos necesarios.
- Validar webhooks con HMAC antes de llamar al dominio.
- Sanitizar payloads antes de persistir.

Este loop no crea ese adapter.

## Datos que viajan al proveedor

En una llamada real futura, el adapter podra enviar:

- Identificador de agente de proveedor configurado en secret/config manager.
- Identificador de numero/agente de proveedor configurado fuera del repo.
- `to_number` resuelto en runtime por `ContactResolverPort`.
- Proposito/campana sanitizada cuando aplique.
- Metadata minima no sensible.

## Datos que no se persisten

Hyperion no debe persistir por defecto:

- `to_number` real.
- `from_number` real.
- Audio crudo.
- Transcript crudo.
- URLs crudas de audio o grabacion.
- Secretos.
- API keys.
- Payloads crudos de proveedor.
- Datos reales de pacientes o usuarios.

## PBX fuera de alcance

PBX propio queda fuera de esta fase. Servira despues para inbound, IVR interno, colas, redireccion a
humanos y reglas de transferencia. D02 outbound no queda bloqueado por PBX.
