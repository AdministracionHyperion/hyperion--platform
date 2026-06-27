# Dialer Internal Endpoint Requirements

El endpoint interno futuro para Hyperion debe ser distinto de demo/UI.

## Requisitos Minimos

- Auth obligatoria en prod.
- Signature/HMAC o mTLS segun decision futura.
- Idempotency key persistida.
- Dry-run real sin provider egress.
- `externalRequestId` requerido.
- `tenantId` requerido.
- Consentimiento auditable.
- No telefonos persistidos.
- No transcript/audio/raw payload persistido.
- Respuesta segura con references y estado.
- Retry y DLQ definidos.
- Atomic mark attempted/processed.
- Logs PII-safe.
- Rate limit distribuido.

## Endpoint Conceptual Futuro

`POST /internal/hyperion/calls/dispatch` queda documentado como requerimiento futuro, no como ruta
activa en Hyperion.
