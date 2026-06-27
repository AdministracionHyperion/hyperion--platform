# Internal Dialer Adapter Contract

`InternalDialerAdapter` encapsula cualquier integracion futura con el dialer. En el estado actual es
blocked-by-default.

## Puerto

- `validateRequest(request, context)`.
- `dryRun(request, context)`.
- `dispatch(request, context)`.
- `getStatus(requestId, context)`.
- `normalizeResult(result, context)`.

## Request

Campos permitidos:

- `externalRequestId`.
- `tenantId`.
- `mode`: `single` o `campaign`.
- `runtimeMode`: `dry_run`, `blocked` o `future_live`.
- `safeContactRef`.
- `phoneE164NonPersistable` solo runtime-only futuro, nunca persistido.
- `agentAlias`.
- `callerAlias`.
- `dynamicVars` sanitizadas.
- `consent.granted`.
- `consentRef`.
- `callbackAlias` o `internalEventTopic`.
- `approvalRef`, `runbookRef`, `providerConfigRef`, `secretManagerRef`.
- `metadata` sanitizada.

## Result

- `internalCallId`.
- `externalRequestId`.
- `status`: `blocked`, `dry_run_accepted`, `accepted_future` o `failed`.
- `providerConversationRef` sanitizado opcional.
- `idempotencyKey`.
- `blockedReasons`.
- `auditRef` opcional.
- `metadata` sanitizada.

## Reglas

- `dispatch` queda bloqueado por defecto.
- `dryRun` solo acepta `runtimeMode=dry_run`.
- No hay red.
- No hay HTTP client.
- No hay provider SDK.
- No se usan endpoints demo o campaign-start.
- No se persisten numeros, transcripts, audio, payloads crudos ni secretos.
