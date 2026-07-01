# CEDCO D02 - Definition of Done

## DoD del cierre staging seguro

- Repo Git verificado contra remoto oficial y PRs mergeados con CI verde.
- `_private/` ignorado por Git y Word fuente usados solo como referencia local.
- Documentacion sanitizada creada en `docs/`.
- Hyperion documentado y desplegado como control plane staging.
- API CEDCO D02 y mock runtime disponibles.
- Dashboard D02 HTML/API read-only disponible.
- Reporte operacional D02 disponible con matriz de controles.
- Persistencia Prisma para configuracion, metricas y evidencia operacional.
- Mock provider/event/post-call implementado y validado.
- Evals D02 deterministicas pasando.
- Policy gates bloquean llamadas reales, provider egress, media cruda y export peligroso.
- Validacion publica HTTPS de dashboard/reporte sin secretos ni PII.
- Sin telefonia/PBX real, sin llamadas reales continuas y sin vertical de inventario/activos.

## DoD futuro antes de integracion real adicional

- Modelo de dominio aprobado.
- Contratos internos definidos.
- Persistencia de estados y auditoria implementada.
- Mock provider implementado y validado.
- Webhook sanitizer implementado y validado.
- Observabilidad minima implementada.
- Evals aprobados.
- Smoke local aprobado al final.
- Runbook revisado.
- Rollback definido.
- Secret manager configurado.
- Flags de egress apagados por defecto y habilitables manualmente.
- Aprobacion humana explicita para cualquier llamada real.
