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
- Estado: DONE.

## Fase 1 - Dominio y contratos

- Entidades de solicitud de llamada.
- Estados y transiciones.
- Razones de bloqueo.
- `CallProviderPort`.
- `ContactResolver` conceptual.
- Politicas de consentimiento, opt-out, horario y rate limit.
- Estado: DONE.

## Fase 2 - Persistencia y auditoria

- Persistencia de solicitudes y estados.
- Audit log por `tenantId` y `correlationId`.
- Referencias sanitizadas de proveedor.
- No persistencia de telefonos reales en claro.
- Estado: DONE.

## Fase 3 - Adapters locales

- `MockCallProviderAdapter`.
- Simulacion de provider events.
- Simulacion de post-call webhook sanitizado.
- Estado: DONE.

## Fase 4 - Seguridad y observabilidad

- HMAC webhook validation.
- Sanitizer.
- Logs estructurados sin PII.
- Metricas por tenant.
- Alertas de fallos y bloqueos.
- Estado: DONE para staging seguro.

## Fase 5 - Evals e integracion

- Evals de intencion, contexto, handoff y seguridad.
- Dashboard/reporte operacional D02.
- Matriz de controles y policy gates.
- Estado: DONE para staging seguro.

## Fase 6 - Integraciones controladas no telefonicas

- Google Calendar OAuth staging.
- CRM/ERP sandbox contracts.
- EPS/convenios sandbox.
- Document source connector.
- Estado: GATED por aprobacion, credenciales runtime, rollback y datos sanitizados.

## Fase 7 - Provider metadata-only

- Webhook metadata-only real si se aprueba.
- Sin audio raw.
- Sin transcript raw.
- Sin llamadas continuas.
- Estado: GATED por aprobacion explicita.

## Fase 8 - Primera llamada controlada futura

- Smoke local.
- Runbook revisado.
- Secret manager configurado.
- Flags manuales.
- Aprobacion humana.
- Una llamada de prueba autorizada.
- Estado: fuera del cierre actual.
