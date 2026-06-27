# API Contracts

Todos los endpoints responden con envelope estandar:

- Exito: `{ ok: true, data, meta }`
- Error: `{ ok: false, error, meta }`

`meta` incluye `correlationId`, `tenantId` cuando aplica y `timestamp`.

## Publico

- `GET /health`: health del API, sin DB.
- `GET /api/v1/version`: version contractual, commit `unknown` si no esta disponible.

## Core

- `GET /api/v1/tenants/:tenantId/context`
  - Permisos: actor valido.
  - Devuelve tenant, actor, roles y correlation id.
- `GET /api/v1/tenants/:tenantId/features/:flagKey`
  - Permisos: `tenant:read`.
  - Devuelve flag evaluada por servicio inyectado; con Prisma lee flag tenant-scoped o default
    false.

## Agent Platform

- `POST /api/v1/tenants/:tenantId/agents`
  - Permiso: `agent:write`.
  - Crea agente draft; con Prisma queda persistido.
- `POST /api/v1/tenants/:tenantId/agents/:agentId/versions`
  - Permiso: `agent:write`.
  - Crea version draft; con Prisma queda persistida y no activa automaticamente.

## Voice

- `POST /api/v1/tenants/:tenantId/voice/calls`
  - Permiso: `voice:call:write`.
  - Crea CallSession draft persistible. No hace dispatch.
- `POST /api/v1/tenants/:tenantId/voice/calls/:callId/events`
  - Permiso: `voice:call:write`.
  - Registra evento sanitizado persistible.
- `GET /api/v1/tenants/:tenantId/voice/calls/:callId`
  - Permiso: `voice:call:read`.
  - Devuelve sesion si existe en el servicio inyectado o Prisma.

## CEDCO D02

- `GET /api/v1/tenants/:tenantId/products/cedco/d02/configuration`
- `PUT /api/v1/tenants/:tenantId/products/cedco/d02/configuration`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/intents/classify`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/readiness/evaluate`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/compliance/evaluate`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/handoff/evaluate`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/scheduling/requests`
- `POST /api/v1/tenants/:tenantId/products/cedco/d02/eligibility/checks`
- `GET /api/v1/tenants/:tenantId/products/cedco/d02/metrics/summary`

CEDCO D02 no habilita llamadas reales. `realCallsEnabled=true` se rechaza.
