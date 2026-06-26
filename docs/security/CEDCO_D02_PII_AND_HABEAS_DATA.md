# CEDCO D02 - PII y habeas data

## Principios

- Minimizar datos.
- Usar finalidad explicita.
- Validar consentimiento.
- Respetar opt-out.
- Evitar datos reales en desarrollo.
- Auditar decisiones.
- Sanitizar antes de persistir.
- Mantener secretos fuera del repo.

## Datos que no se guardan por defecto

- Raw transcript.
- Audio crudo.
- Telefonos reales en claro.
- Secretos.
- API keys.
- IDs reales de proveedor en fixtures o repo.
- Datos reales de pacientes, usuarios o contactos.

## Datos internos permitidos

- `tenantId`.
- `correlationId`.
- `callRequestId`.
- `calleeAlias`.
- Estado.
- Razon de bloqueo o fallo.
- Versiones activas.
- Referencias sanitizadas de proveedor.
- Metricas agregadas.
- Eventos de auditoria.

## Datos enviados a proveedor

En runtime y solo tras validaciones:

- `agent_id`.
- `agent_phone_number_id`.
- `to_number`.

`to_number` se obtiene desde `calleeAlias` por `ContactResolver` y no se persiste en claro.

## Controles minimos

- RBAC antes de crear o aprobar solicitud.
- Consentimiento vigente.
- Opt-out respetado.
- Validacion de horario.
- Rate limit por tenant/campana.
- AgentVersion activa.
- KnowledgeBaseVersion activa.
- Provider configurado.
- SIP trunk verificado antes de egress real.
- `real_calls_disabled` como default.
- Audit log obligatorio.
