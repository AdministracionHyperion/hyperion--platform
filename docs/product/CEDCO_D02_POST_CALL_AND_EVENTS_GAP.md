# CEDCO D02 - Gap post-call y eventos

## Estado

El modelo Prisma contiene sesiones, eventos de llamada, eventos provider, post-call y metricas. El
flujo staging actual valida dry-run, dispatch blocked, ingestion mock sanitizada, replay safety,
post-call y dashboard/reporte operacional sin eventos reales de proveedor.

## Gaps

| Area                     | Estado       | Cierre requerido                                          |
| ------------------------ | ------------ | --------------------------------------------------------- |
| Provider event ingestion | STAGING DONE | Fixtures mock sanitizados antes de webhook real.          |
| Sanitizer provider       | STAGING DONE | Cubre mock provider payloads sin copiar logs crudos.      |
| Post-call result         | STAGING DONE | Persiste resumen sintetico, outcome y handoff result.     |
| Metrics rollup           | STAGING DONE | Genera metricas desde eventos persistidos y mock flow.    |
| Audit linkage            | STAGING DONE | Correlaciona session, event, actor, tenant y correlation. |
| Replay safety            | STAGING DONE | Valida replay/idempotencia en ingestion mock provider.    |

## Reglas

- No audio raw.
- No transcript raw.
- No DB dump.
- No logs crudos.
- No provider IDs reales en docs.
- No llamadas reales hasta aprobacion.

## Siguiente paso recomendado

Mantener proveedor real bloqueado hasta abrir un gate separado para webhook metadata-only real con
payload sanitizado, sin audio, sin transcript raw y sin IDs reales en docs.
