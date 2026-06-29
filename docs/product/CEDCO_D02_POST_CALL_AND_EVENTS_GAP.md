# CEDCO D02 - Gap post-call y eventos

## Estado

El modelo Prisma contiene sesiones, eventos de llamada, eventos provider, post-call y metricas. El
flujo staging actual valida dry-run y dispatch blocked, pero no ingiere eventos reales de proveedor.

## Gaps

| Area                     | Estado      | Cierre requerido                                            |
| ------------------------ | ----------- | ----------------------------------------------------------- |
| Provider event ingestion | NOT STARTED | Fixtures sanitizados antes de webhook real.                 |
| Sanitizer provider       | PARTIAL     | Debe cubrir payloads ElevenLabs reales sin copiar raw logs. |
| Post-call result         | PARTIAL     | Persistir resumen sintético y handoff result.               |
| Metrics rollup           | PARTIAL     | Generar metricas desde eventos persistidos.                 |
| Audit linkage            | PARTIAL     | Correlacionar session, event, actor y tenant.               |
| Replay safety            | PARTIAL     | Validar idempotencia de eventos provider.                   |

## Reglas

- No audio raw.
- No transcript raw.
- No DB dump.
- No logs crudos.
- No provider IDs reales en docs.
- No llamadas reales hasta aprobacion.

## Siguiente paso recomendado

Implementar `STAGING-AUTO-3` con fixtures provider sanitizados, ingestion mock y dashboard minimo
sobre Prisma staging.
