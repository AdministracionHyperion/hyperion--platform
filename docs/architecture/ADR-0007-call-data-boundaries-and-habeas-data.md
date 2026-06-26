# ADR-0007: Limites de datos de llamada y habeas data

## Estado

Aceptado.

## Decision

Hyperion debe operar D02 con minimo dato necesario, auditoria obligatoria y proteccion de habeas data.

## Datos prohibidos en repo y logs

- No telefonos reales en repo.
- No telefonos reales en logs.
- No secretos.
- No API keys.
- No `agent_id` real.
- No `agent_phone_number_id` real.
- No datos reales de pacientes, usuarios o contactos.
- No raw transcript por defecto.
- No audio crudo por defecto.

## Identificadores internos

- `tenantId` es obligatorio.
- `correlationId` es obligatorio.
- `calleeAlias` es el identificador interno del destinatario.
- `callRequestId` identifica la solicitud interna de llamada.
- `providerConversationRef` puede mapear `conversation_id` de proveedor de forma sanitizada.
- `providerSipCallRef` puede mapear `sip_call_id` de proveedor de forma sanitizada.

## ContactResolver

`ContactResolver` sera un componente externo/futuro que convierte `calleeAlias` a E.164 solo al momento de dispatch.

Reglas:

- El dominio trabaja con `calleeAlias`, no con telefono real.
- `to_number` solo existe en runtime durante dispatch.
- `to_number` solo se entrega al proveedor autorizado.
- `to_number` no se persiste en claro.
- Los errores de resolucion producen bloqueo `invalid_callee_alias`.

## Datos que viajan al proveedor

Solo en runtime y despues de validaciones:

- `agent_id` configurado fuera del repo.
- `agent_phone_number_id` configurado fuera del repo.
- `to_number` E.164 resuelto por `ContactResolver`.
- Metadatos minimos estrictamente necesarios para correlacion cuando el proveedor lo permita.

## Datos que Hyperion guarda

- `tenantId`.
- `correlationId`.
- `callRequestId`.
- `calleeAlias`.
- Estado de llamada.
- Razon de bloqueo o fallo.
- Referencias sanitizadas de proveedor.
- Timestamps.
- Versiones activas usadas: AgentVersion y KnowledgeBaseVersion.
- Auditoria de validaciones y decisiones.
- Metricas agregadas y feedback sanitizado.

## Webhooks post-call

Los webhooks de ElevenLabs pueden entregar transcripcion, audio o fallo de inicio de llamada.

Hyperion debe:

- Validar HMAC antes de procesar.
- Rechazar payload sin firma valida.
- Sanitizar payload antes de persistir.
- Descartar raw transcript y audio crudo por defecto.
- Persistir solo resumen, clasificaciones, metricas y eventos permitidos por politica.

## Habeas data

Toda decision de persistencia debe partir de minimizacion, finalidad, autorizacion, auditoria y capacidad de eliminacion/retencion segun politica aplicable.
