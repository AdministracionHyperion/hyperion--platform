# Voice Call Lifecycle

## Estados

`CallStatus` define:

- `draft`.
- `awaiting_approval`.
- `approved`.
- `scheduled`.
- `queued`.
- `dispatching`.
- `sent_to_provider`.
- `ringing`.
- `in_progress`.
- `voicemail`.
- `completed`.
- `handoff`.
- `failed`.
- `blocked`.
- `cancelled`.
- `post_call_pending`.
- `post_call_ingested`.
- `reviewed`.

## Transiciones iniciales

Transiciones permitidas:

- `draft -> awaiting_approval`.
- `awaiting_approval -> approved`.
- `approved -> scheduled`.
- `approved -> queued`.
- `scheduled -> queued`.
- `queued -> dispatching`.
- `dispatching -> sent_to_provider`.
- `sent_to_provider -> ringing`.
- `sent_to_provider -> failed`.
- `ringing -> in_progress`.
- `ringing -> voicemail`.
- `ringing -> failed`.
- `in_progress -> completed`.
- `in_progress -> handoff`.
- `in_progress -> failed`.
- `voicemail -> post_call_pending`.
- `completed -> post_call_pending`.
- `handoff -> post_call_pending`.
- `failed -> post_call_pending`.
- `post_call_pending -> post_call_ingested`.
- `post_call_ingested -> reviewed`.

Estados terminales declarados:

- `cancelled`.
- `reviewed`.
- `blocked`.

## Eventos

`CallEvent` registra hechos sanitizados de la llamada:

- `call.created`.
- `call.status_changed`.
- `call.turn_recorded`.
- `call.provider_event_ingested`.
- `call.post_call_ingested`.
- `call.closed`.
- `call.handoff_requested`.
- `call.handoff_assigned`.
- `call.handoff_resolved`.

Cada evento incluye `tenantId`, `callId`, `correlationId`, `occurredAt` y metadata sanitizada.

## Turnos

`ConversationTurn` guarda `contentRedacted`, nunca transcript crudo por defecto. Los roles
permitidos son `user`, `agent`, `human`, `system` y `tool`.

## Post-call

El post-call entra como `PostCallWebhookEnvelope` y `PostCallResult`. El dominio exige firma
verificada como precondicion conceptual. El payload debe estar sanitizado y no puede incluir
transcript crudo, audio URL cruda, telefonos reales, emails, documentos ni secretos.

## Handoff

`TurnDecision` puede seleccionar `handoff`. El dominio de handoff crea, asigna y resuelve
`HandoffRequest` con resumen redactado. La resolucion puede generar feedback.

## Feedback

`CloseCallSession`, `IngestPostCallResult` y `ResolveHandoff` pueden registrar feedback si se
inyecta `FeedbackRepositoryPort`. El feedback conserva `tenantId` y `correlationId`, y sanitiza
metadata.

## Dominio, adapter y runtime

Dominio:

- Define entidades, estados, politicas y puertos.
- No transporta audio.
- No llama proveedores.
- No persiste datos reales sensibles.

Adapter:

- Implementara `CallProviderPort`, `SpeechToTextPort` o `TextToSpeechPort`.
- Vive fuera de `modules/voice`.
- Traduce contratos de dominio a APIs de proveedor.

Runtime:

- Ejecutara jobs, webhooks, llamadas y eventos reales en loops posteriores.
- Usara feature flags, secret manager, observabilidad y runbooks antes de cualquier llamada real.
