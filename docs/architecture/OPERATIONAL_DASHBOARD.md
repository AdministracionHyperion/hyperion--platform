# Operational Dashboard

El dashboard operacional es una consola solo lectura para observar el estado controlado de Hyperion
y CEDCO D02 mientras el sistema sigue en modo mock.

## Proposito

- Mostrar salud operacional basica.
- Resumir flujos mock de llamada.
- Resumir eventos mock de proveedor ya sanitizados.
- Mostrar estado de policy gates, rate limits, audit, metricas y evals.
- Hacer visible que las acciones peligrosas siguen bloqueadas.

## Read models

El read model se construye en `modules/core/operations-dashboard` y se especializa para CEDCO D02 en
`modules/products/cedco/d02-calls/src/application/dashboard`.

Incluye:

- `tenantId`, `correlationId` y `generatedAt`.
- `overallStatus` y summary cards.
- Mock call flows con referencias `mock_call_*`.
- Provider events `provider.mock.*`.
- Eval summary deterministico.
- Runtime safety flags, todos en modo seguro.
- Audit preview sanitizado.
- Metrics snapshot sanitizado.

## Fuentes

La API puede construir el dashboard desde servicios fake o desde servicios Prisma inyectados. La app
factory no abre conexion por si sola. Los tests de integracion usan PostgreSQL efimero y Fastify
inject, sin `server.listen`.

## Limites

No hay acciones, dispatch, provider egress, deploy, workers daemon, adapter real, rutas de webhook
real ni datos reales. El dashboard no guarda ni renderiza telefono, transcript crudo, audio, payload
crudo, email, documento, token, API key, password ni provider IDs reales.

## Evolucion futura

Cuando existan runtime y adapters reales, este dashboard debera seguir consumiendo read models
sanitizados y agregar controles operacionales solo despues de approvals, runbooks, secret manager,
provider configuration y policy gates explicitos.
