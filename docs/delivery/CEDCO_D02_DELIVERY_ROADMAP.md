# CEDCO D02 - Roadmap de delivery

## Principio de orden

El orden de delivery sigue la decision no smoke-first:

1. Dominio.
2. Contratos.
3. Persistencia.
4. Adapters.
5. Seguridad.
6. Observabilidad.
7. Evals.
8. Integracion.
9. Smoke final.

## Fase 0 - Baseline y arquitectura

- Repo limpio.
- Documentacion SIP-first.
- Limites de datos.
- Estados de llamada.
- Runbooks iniciales.

## Fase 1 - Dominio y contratos

- Entidades de solicitud de llamada.
- Estados y transiciones.
- Razones de bloqueo.
- `CallProviderPort`.
- `ContactResolver` conceptual.
- Politicas de consentimiento, opt-out, horario y rate limit.

## Fase 2 - Persistencia y auditoria

- Persistencia de solicitudes y estados.
- Audit log por `tenantId` y `correlationId`.
- Referencias sanitizadas de proveedor.
- No persistencia de telefonos reales en claro.

## Fase 3 - Adapters locales

- `MockCallProviderAdapter`.
- Simulacion de provider events.
- Simulacion de post-call webhook sanitizado.

## Fase 4 - Seguridad y observabilidad

- HMAC webhook validation.
- Sanitizer.
- Logs estructurados sin PII.
- Metricas por tenant.
- Alertas de fallos y bloqueos.

## Fase 5 - Evals e integracion

- Evals de intencion, contexto, handoff y seguridad.
- Spike de conectividad ElevenLabs SIP.
- `ElevenLabsSipTrunkAdapter` cuando contratos y seguridad esten aprobados.

## Fase 6 - Smoke final y primera llamada controlada

- Smoke local.
- Runbook revisado.
- Secret manager configurado.
- Flags manuales.
- Aprobacion humana.
- Una llamada de prueba autorizada.
