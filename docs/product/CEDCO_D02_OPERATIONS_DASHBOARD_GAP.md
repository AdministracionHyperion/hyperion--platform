# CEDCO D02 - Gap dashboard operativo

## Estado

El backend ya expone piezas de dominio, metricas y persistencia. La experiencia operativa D02 queda
expuesta como HTML/API de solo lectura y reporte operacional, sin llamadas reales, sin provider
egress, sin PBX y sin activos fijos.

## Vistas minimas

| Vista               | Estado       | Contenido minimo                                               |
| ------------------- | ------------ | -------------------------------------------------------------- |
| Health staging      | STAGING DONE | Runtime safety, dialer readiness, DB/idempotencia y gates.     |
| Sesiones de llamada | STAGING DONE | Estado, intento, tenant, timestamps y resultado sanitizado.    |
| Eventos provider    | STAGING DONE | Eventos mock sanitizados, sin audio/transcript raw ni egress.  |
| Post-call           | STAGING DONE | Resumen, resultado, handoff y metricas desde mock flow seguro. |
| Auditoria           | STAGING DONE | Actor, accion, resultado y correlacion sanitizada por tenant.  |
| Errores             | STAGING DONE | Denials de policy, replay y estados degradados en read model.  |
| Reporte CEDCO       | STAGING DONE | KPIs y exclusiones del alcance actual desde endpoint dedicado. |

## Reglas de seguridad

- No mostrar numeros reales sin redaccion.
- No mostrar transcript raw.
- No mostrar audio.
- No mostrar provider secrets.
- No exponer `agent_id` o `phone_number_id` reales en vistas generales.
- Mantener filtros por tenant.

## Superficies disponibles

- `GET /api/v1/tenants/:tenantId/products/cedco/d02/dashboard`
- `GET /api/v1/tenants/:tenantId/products/cedco/d02/reports/operational-summary`
- `GET /api/v1/tenants/:tenantId/operations/dashboard`
- `GET /api/v1/tenants/:tenantId/operations/dashboard/mock-call-flows`
- `GET /api/v1/tenants/:tenantId/operations/dashboard/provider-events`
- `GET /api/v1/tenants/:tenantId/operations/dashboard/evals`
