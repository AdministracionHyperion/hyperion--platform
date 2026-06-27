# CEDCO D02 API Contracts

CEDCO D02 expone endpoints contractuales para preparar el producto de llamadas salientes
controladas. No hay llamadas reales, PBX, SIP real, runtime de voz ni integraciones externas.

## Configuracion

- `GET /api/v1/tenants/:tenantId/products/cedco/d02/configuration`
- `PUT /api/v1/tenants/:tenantId/products/cedco/d02/configuration`

`realCallsEnabled` queda `false`. Si el cliente intenta ponerlo en `true`, la API responde
`validation_error`.

## Intenciones y readiness

- `POST /api/v1/tenants/:tenantId/products/cedco/d02/intents/classify`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/readiness/evaluate`

La clasificacion usa reglas deterministicas de dominio. Readiness nunca declara produccion lista.

## Compliance y handoff

- `POST /api/v1/tenants/:tenantId/products/cedco/d02/compliance/evaluate`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/handoff/evaluate`

Se bloquea diagnostico, triage clinico, datos reales y contenido fuera de alcance. Urgencia y
solicitud de humano recomiendan handoff sin diagnosticar.

## Scheduling, eligibility y metricas

- `POST /api/v1/tenants/:tenantId/products/cedco/d02/scheduling/requests`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/eligibility/checks`
- `GET /api/v1/tenants/:tenantId/products/cedco/d02/metrics/summary`

Scheduling solo devuelve mock o integration_required. Eligibility no valida derechos reales.
