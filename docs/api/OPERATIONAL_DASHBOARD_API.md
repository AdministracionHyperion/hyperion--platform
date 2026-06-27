# Operational Dashboard API

La API de dashboard operacional expone endpoints GET solo lectura bajo el tenant.

## Endpoints

- `GET /api/v1/tenants/:tenantId/operations/dashboard`
- `GET /api/v1/tenants/:tenantId/operations/dashboard/mock-call-flows`
- `GET /api/v1/tenants/:tenantId/operations/dashboard/provider-events`
- `GET /api/v1/tenants/:tenantId/operations/dashboard/evals`

Todas las rutas requieren `x-actor-id` y `x-actor-roles`. Preservan o generan `correlationId` y
responden con el envelope estandar de la API.

## Permisos

Los reads usan permisos existentes de lectura operacional:

- `tenant:read`
- `audit:read`
- `voice:call:read`
- `agent:read`

No hay endpoints POST, PUT o DELETE para acciones de dashboard.

## Campos seguros

Las respuestas pueden incluir:

- Summary cards.
- Runtime safety flags en valores seguros.
- Mock call flows con `safeContactRef`.
- Provider events mock ya normalizados.
- Eval summary deterministico.
- Audit preview sanitizado.
- Metrics snapshot sanitizado.

## Campos prohibidos

La API no debe devolver telefono real, `phoneNumber`, `to_number`, `from_number`, transcript crudo,
`rawTranscript`, `audioUrl`, `recordingUrl`, `rawPayload`, email, documento, `token`, `apiKey`,
`secret`, `password`, `agent_id` real ni `phone_number_id` real.

## Operacion

Las rutas registran logs, metricas y audit segun los hooks existentes. El dashboard respeta rate
limits y policy gates de lectura. No dispara jobs, llamadas, provider egress, evals remotos ni
conexion a servicios externos.
