# D02 Metadata Allowlists

CEDCO D02 ya no acepta metadata generica permisiva en endpoints sensibles. Las rutas de mock flow,
provider events, scheduling, eligibility, compliance, handoff y readiness usan allowlists de claves
seguras.

## Claves Permitidas

Las claves permitidas son referencias sinteticas y operacionales como `source`, `channel`,
`scenarioId`, `testCaseId`, `correlationId`, `safeCallSessionRef`, `eventRef`, `purpose`, `reason`,
`mode`, `outcome`, `disposition`, `consentRef`, `safeContactRef`, `patientContextRef`, `serviceRef`,
`siteRef`, `agreementRef` y `metricName`.

## Bloqueado

- `phone`, `phoneNumber`, `to_number`, `from_number`.
- `rawTranscript`, `transcript`.
- `audioUrl`, `recordingUrl`.
- `rawPayload`.
- `email`, `documentNumber`.
- `apiKey`, `token`, `secret`, `password`.
- URLs de proveedor.
- `agent_id` o `phone_number_id` con apariencia real.

## Resultado

La API responde `validation_error` antes de ejecutar la logica de ruta cuando aparece metadata fuera
de allowlist o un valor sensible.
