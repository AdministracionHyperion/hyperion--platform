# Dialer Hyperion Integration Decision Template

## Opciones

### A. Hyperion -> ElevenLabs Directo

Hyperion controla directamente el provider futuro.

### B. Hyperion -> InternalDialerAdapter -> Dialer Actual

Hyperion usa un adapter interno para hablar con el dialer existente si este supera auditoria.

### C. Hibrido

Hyperion usa directo para flujos nuevos y adapter para compatibilidad temporal.

## Criterios

- Endpoints del dialer.
- Seguridad.
- Idempotencia.
- Logging.
- Webhooks.
- Retries.
- PII.
- Secrets.
- Dry-run.
- SIP/DID handling.
- ElevenLabs handling.
- Observabilidad.
- Auditoria.
- Backpressure.
- Rollback.

## Decision

- Opcion elegida:
- Razon:
- Riesgos:
- Requisitos previos:
- Runbook requerido:
- Secret manager requerido:
- Fecha de reevaluacion:
