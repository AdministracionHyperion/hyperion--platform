# Job Contracts

## JobEnvelope

Cada job incluye:

- `jobId`
- `type`
- `tenantId`
- `actorId` opcional
- `correlationId`
- `priority`
- `payload` sanitizado
- `status`
- `attempts`
- `maxAttempts`
- `scheduledAt` opcional
- `createdAt`
- `updatedAt`

El payload no debe contener PII, secretos, raw transcript, audio URL cruda ni datos de proveedor.

## Estados

- `queued`
- `running`
- `succeeded`
- `failed`
- `dead_lettered`
- `cancelled`
- `blocked`

## Tipos permitidos

- `outbox.process`
- `voice.call.prepare`
- `voice.call.event.process`
- `voice.post_call.process`
- `cedco_d02.readiness.evaluate`
- `cedco_d02.compliance.evaluate`
- `cedco_d02.metric.record`

## Jobs peligrosos bloqueados

No existen contratos para dispatch real, egress de proveedor, ElevenLabs, SIP ni production deploy.
Si un payload intenta activar llamadas reales, proveedor, raw transcript, raw recording o export de
datos, `WorkerRuntimeSafety` debe bloquearlo antes del handler.
