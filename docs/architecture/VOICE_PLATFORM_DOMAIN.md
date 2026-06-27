# Voice Platform Domain

## Proposito

Voice Platform Domain es la capa transversal para modelar sesiones de voz, orquestacion de turnos,
contratos de telefonia, contratos de speech y handoff humano. CEDCO D02 y futuros productos deben
componer esta capa; Voice no depende de productos ni de proveedores reales.

Este loop implementa dominio, politicas, puertos, fakes y pruebas unitarias. No implementa
persistencia real, API HTTP, workers reales, runtime de llamadas, CEDCO D02 especifico, ElevenLabs,
SIP real, STT/TTS real, WebSocket ni PBX.

## Voice Core

Modulo: `modules/voice/voice-core`.

Entidades y value objects:

- `CallId`.
- `CallSession`.
- `CallDirection`.
- `CallStatus`.
- `CallParticipant`.
- `ConversationTurn`.
- `CallEvent`.
- `TranscriptPolicy`.
- `RecordingPolicy`.
- `CallDataPolicy`.

Puertos:

- `CallSessionRepositoryPort`.
- `CallEventRepositoryPort`.

Use cases:

- `createCallSession`.
- `registerCallEvent`.
- `recordConversationTurn`.
- `transitionCallStatus`.
- `closeCallSession`.

Reglas principales:

- `CallId` usa formato seguro lowercase con numeros y guiones.
- `CallSession` siempre lleva `tenantId` y `correlationId`.
- Metadata se sanitiza con `SafeMetadata`.
- No se guarda telefono real, transcript crudo, audio crudo, URL cruda de grabacion ni secretos.
- Las transiciones de estado se validan explicitamente.

## Call Orchestration

Modulo: `modules/voice/call-orchestration`.

Entidades y contratos:

- `CallObjective`.
- `CallContext`.
- `CallRuntimeRef`.
- `CallOrchestrationPlan`.
- `TurnDecision`.
- `TurnAction`.
- `OrchestrationPolicy`.

Puertos:

- `CallContextLoaderPort`.
- `IntentEnginePort`.
- `ResponseGeneratorPort`.
- `ToolExecutorPort`.

Use cases:

- `prepareCallOrchestration`.
- `decideNextTurn`.
- `applyTurnDecision`.

Reglas principales:

- No llama LLM real.
- No ejecuta tools reales.
- No contiene logica especifica de CEDCO D02.
- Usa referencias de runtime versionadas, no IDs reales de proveedores.

## Telephony

Modulo: `modules/voice/telephony`.

Entidades y contratos:

- `CalleeAlias`.
- `CallerAlias`.
- `ProviderCallReference`.
- `CallProviderEvent`.
- `OutboundCallLaunchRequest`.
- `OutboundCallLaunchResult`.
- `PostCallWebhookEnvelope`.
- `PostCallResult`.
- `CallDispatchPolicy`.
- `CallProviderConfig`.
- `SipTrunkReadiness`.

Puertos:

- `CallProviderPort`.
- `ContactResolverPort`.
- `ProviderEventIngestionPort`.

Use cases:

- `prepareOutboundCallLaunch`.
- `dispatchOutboundCall`.
- `ingestProviderCallEvent`.
- `ingestPostCallResult`.

Reglas principales:

- `CalleeAlias` y `CallerAlias` no son numeros reales.
- `ContactResolverPort` resuelve E.164 solo en runtime y lo marca como no persistible.
- `CallProviderPort` permite que un futuro `ElevenLabsSipTrunkAdapter` exista fuera del dominio.
- `realCallsEnabled` queda apagado por defecto; solo fake provider puede operar en tests.
- La ruta real futura requiere configuracion de proveedor y trunk SIP verificado.

## Speech

Modulo: `modules/voice/speech`.

Entidades y contratos:

- `VoiceProfile`.
- `VoiceLocale`.
- `SpeechProviderConfig`.
- `SpeechSegment`.
- `SpeechTranscript`.
- `SpeechSynthesisRequest`.
- `SpeechSynthesisResult`.
- `TurnTakingPolicy`.
- `LatencyBudget`.

Puertos:

- `SpeechToTextPort`.
- `TextToSpeechPort`.

Use cases:

- `validateVoiceProfile`.
- `validateTurnTakingPolicy`.

Reglas principales:

- `es-CO` esta permitido y es el default recomendado.
- No hay STT real.
- No hay TTS real.
- La transcripcion expuesta por contrato es redacted.

## Handoff

Modulo: `modules/voice/handoff`.

Entidades y contratos:

- `HandoffRule`.
- `HandoffTrigger`.
- `HandoffPriority`.
- `HandoffRequest`.
- `HandoffStatus`.
- `HandoffQueue`.
- `HandoffAssignment`.
- `HandoffSummary`.
- `HandoffPolicy`.

Puerto:

- `HandoffRepositoryPort`.

Use cases:

- `createHandoffRequest`.
- `assignHandoff`.
- `resolveHandoff`.

Reglas principales:

- Crear handoff requiere `voice:handoff:manage` o `voice:call:write`.
- Asignar y resolver handoff requiere `voice:handoff:manage`.
- `HandoffSummary` debe ser redactado.
- Resolver handoff puede registrar feedback sanitizado.

## Integracion con Core Platform

Voice Platform reutiliza:

- `OperationContext`.
- `SafeMetadata`.
- `Result`.
- `ActorContext` y RBAC.
- `AuditLogPort`.
- `EventBusPort`.
- `FeedbackRepositoryPort`.

## Conexion futura con Agent Platform y CEDCO D02

Voice puede referenciar `agentVersionId`, `promptVersionId`, `flowVersionId` y
`knowledgeBaseVersionId` como strings de runtime. No modifica Agent Platform.

CEDCO D02 usara Voice Platform para orquestar llamadas outbound, estados, eventos, post-call y
handoff. CEDCO D02 no debe contaminar Voice con reglas especificas del producto.

## Todavia no existe

- Persistencia real.
- Prisma/PostgreSQL.
- API HTTP.
- Dashboard.
- Workers reales.
- CEDCO D02 runtime.
- Adapter ElevenLabs.
- Adapter SIP real.
- Llamadas reales.
- LLM real.
- STT/TTS real.
- WebSocket real.
- PBX.
- Inbound.
- Smoke tests.
