# Voice Security Baseline

## Tenant isolation

Todas las entidades principales de Voice incluyen `tenantId`. Los use cases operan desde
`OperationContext` y los repositorios reciben `tenantId` para leer o escribir.

## RBAC

Voice usa roles y permisos de Core:

- `voice:call:dispatch` para dispatch outbound.
- `voice:call:write` para operar llamadas y crear handoff cuando aplica.
- `voice:handoff:manage` para asignar y resolver handoff.

Roles de lectura como `tenant-viewer` no pueden despachar llamadas ni administrar handoffs.

## Audit log

Los use cases aceptan `AuditLogPort` cuando aplica. Los eventos de auditoria usan
`OperationContext`, `correlationId`, `tenantId` y metadata sanitizada.

## CorrelationId

`correlationId` es obligatorio en `OperationContext` y se propaga a `CallSession`, `CallEvent`,
post-call y feedback.

## Metadata sanitization

Voice reutiliza `SafeMetadata` y rechaza o redacta claves sensibles:

- `phone`.
- `phoneNumber`.
- `to_number`.
- `from_number`.
- `email`.
- `document`.
- `documentNumber`.
- `password`.
- `secret`.
- `token`.
- `apiKey`.
- `rawTranscript`.
- `transcript`.
- `audioUrl`.
- `recordingUrl`.

## No phone real by default

`CalleeAlias` y `CallerAlias` representan alias logicos. No deben contener telefonos reales, E.164,
prefijos telefonicos ni palabras que indiquen dato telefonico crudo.

## Contact resolver non-persistable

`ContactResolverPort` resuelve el E.164 solo en runtime. El target retornado esta marcado como no
persistible y solo debe cruzar al adapter real al momento del dispatch.

## No raw transcript by default

`ConversationTurn` guarda `contentRedacted`. `TranscriptPolicy` deshabilita transcript crudo por
defecto.

## No audio URL cruda

`RecordingPolicy` deshabilita grabacion cruda por defecto. URLs crudas de audio o grabacion se
rechazan o redactan.

## No secrets

El dominio no usa `.env`, `process.env`, API keys, tokens reales, hostnames reales de proveedor ni
identificadores reales de proveedor. Secret manager pertenece a loops posteriores.

## Post-call HMAC future

El dominio requiere `signatureVerified=true` en `PostCallWebhookEnvelope`. La verificacion HMAC real
se implementara fuera del dominio, antes de invocar `ingestPostCallResult`.

## Habeas data

La postura por defecto minimiza datos: alias internos, metadata segura, transcript redactado,
retencion configurable y no persistencia de telefonos reales. Cualquier excepcion futura requerira
politica explicita, consentimiento, auditoria y aprobacion humana.
