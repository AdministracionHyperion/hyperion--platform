# CEDCO D02 - Flujo de lanzamiento outbound

Este flujo define como se lanza una llamada outbound cuando existan implementacion, flags y proveedor de prueba autorizados. No autoriza llamadas reales en este loop.

## Flujo

1. Operador o sistema crea solicitud de llamada.
2. Hyperion valida tenant.
3. Hyperion valida actor/RBAC.
4. Hyperion valida consentimiento.
5. Hyperion valida opt-out.
6. Hyperion valida horario.
7. Hyperion valida rate limit.
8. Hyperion valida campana/proposito.
9. Hyperion valida `AgentVersion` activa.
10. Hyperion valida `KnowledgeBaseVersion` activa.
11. Hyperion encola llamada.
12. Worker toma job.
13. `ContactResolver` resuelve `calleeAlias` a E.164 en runtime.
14. `ElevenLabsSipTrunkAdapter` construye request.
15. Se envia a ElevenLabs SIP outbound endpoint.
16. ElevenLabs devuelve `conversation_id` y `sip_call_id`.
17. Hyperion guarda referencias sanitizadas.
18. Webhook post-call llega.
19. Hyperion valida HMAC.
20. Hyperion sanitiza payload.
21. Hyperion actualiza estado, metricas, auditoria y feedback.

## Endpoint de proveedor

```text
POST https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call
```

Request requerido:

- `agent_id`
- `agent_phone_number_id`
- `to_number`

Response posible:

- `success`
- `message`
- `conversation_id`
- `sip_call_id`

## Reglas de persistencia

- `to_number` no se persiste en claro.
- `conversation_id` y `sip_call_id` se guardan solo como referencias sanitizadas.
- Raw transcript y audio crudo se descartan por defecto.
- Toda transicion queda en audit log con `tenantId` y `correlationId`.

## Fallos esperados

El flujo puede bloquearse antes de dispatch por consentimiento, opt-out, horario, rate limit, tenant deshabilitado, agente/KB inactivo, proveedor no configurado, SIP trunk no verificado, llamadas reales deshabilitadas, aprobacion humana pendiente, alias invalido o politica PII.
