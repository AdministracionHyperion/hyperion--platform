# CEDCO D02 - Estados de llamada outbound

## Estados

- `draft`: solicitud creada, todavia incompleta.
- `awaiting_approval`: espera aprobacion humana.
- `approved`: aprobada para programacion o encolado.
- `scheduled`: programada para una ventana futura.
- `queued`: lista para worker.
- `dispatching`: worker preparando dispatch.
- `sent_to_provider`: request aceptado por proveedor.
- `ringing`: proveedor reporta timbrado o intento activo.
- `in_progress`: conversacion en curso.
- `voicemail`: llamada llego a buzon o equivalente.
- `completed`: llamada finalizada.
- `handoff`: transferencia a humano activada por reglas.
- `failed`: fallo tecnico u operativo.
- `blocked`: bloqueada por politica o precondicion.
- `cancelled`: cancelada antes de completarse.
- `post_call_pending`: esperando webhook o procesamiento post-call.
- `post_call_ingested`: webhook validado y payload sanitizado.
- `reviewed`: revision operativa o QA completada.

## Razones de bloqueo

- `missing_consent`
- `opt_out`
- `outside_business_hours`
- `rate_limit_exceeded`
- `tenant_disabled`
- `agent_not_active`
- `knowledge_base_not_active`
- `provider_not_configured`
- `sip_trunk_not_verified`
- `real_calls_disabled`
- `human_approval_required`
- `invalid_callee_alias`
- `pii_policy_violation`

## Reglas

- Todo estado requiere `tenantId` y `correlationId`.
- Toda transicion escribe audit log.
- `blocked` debe incluir una razon de bloqueo.
- `failed` debe diferenciar fallo interno, fallo de proveedor y fallo de webhook.
- `post_call_ingested` solo ocurre despues de validar HMAC y sanitizar payload.
