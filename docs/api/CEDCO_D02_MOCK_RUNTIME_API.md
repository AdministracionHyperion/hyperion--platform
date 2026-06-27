# CEDCO D02 Mock Runtime API

## Endpoint

`POST /api/v1/tenants/:tenantId/products/cedco/d02/mock-call-flows`

## Payload permitido

- `cedcoSiteId`
- `serviceId`
- `agreementId` opcional
- `safeContactRef`
- `patientContextRef`
- `consentRef`
- `callPurpose`
- `objective`
- `scriptId` opcional
- `metadata` sanitizada

## Payload prohibido

- `phoneNumber`
- `to_number`
- `from_number`
- `rawTranscript`
- `transcript`
- `audioUrl`
- `recordingUrl`
- `apiKey`
- `token`
- `secret`
- `password`
- `realCallsEnabled=true`
- `providerEgressEnabled=true`
- `runtimeMode=real`

## Respuesta

La respuesta incluye `flowId`, `sessionId`, `status`, `providerCallRef` sintetico `mock_call_*`,
conteo de eventos, `safeSummary`, `disposition`, audit refs y snapshot de metricas in-memory.

No devuelve PII, raw transcript, audio URL ni datos de proveedor real.
