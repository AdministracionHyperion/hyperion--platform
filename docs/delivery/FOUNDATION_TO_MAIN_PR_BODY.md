# Foundation To Main PR Body

## Resumen

Este PR propone llevar la foundation avanzada de Hyperion Platform desde
`foundation/cedco-d02-sip-first-architecture` hacia `main`.

## Que Incluye

- Core Platform.
- Agent Platform.
- Voice Platform.
- CEDCO D02 Domain.
- Prisma/PostgreSQL baseline.
- API + Prisma wiring controlado.
- Observability y audit middleware.
- Policy gates, rate limits y runtime blockers.
- Workers foundation in-memory.
- Mock call runtime.
- Mock provider event ingestion.
- CEDCO D02 deterministic eval suite.
- Operational dashboard skeleton.
- Governance docs.
- D03 fixed assets lane habilitada.
- Dialer audit intake read-only.
- Dialer integration decision: C) Hibrido.
- InternalDialerAdapter contract bloqueado por defecto.

## Que NO Incluye

- No deploy.
- No produccion.
- No llamadas reales.
- No provider real.
- No ElevenLabs real.
- No SIP real.
- No adapter real.
- No HTTP client real hacia dialer.
- No uso de `/api/demo/call`.
- No uso de `/api/campaigns/{campaign_id}/start`.
- No secrets.
- No DB externa real.
- No D03 funcional completo.
- No auditoria VM ejecutada.

## CI

Required checks esperados:

- `CI / Verify / verify`.
- `CI / Verify / db-integration`.
- `CI / Verify / api-integration`.

## Seguridad

- `_private/` no trackeado.
- Sin datos reales.
- Sin secrets.
- Sin rutas reales de webhook o dispatch.
- Sin provider egress.
- Sin llamadas al dialer.
- D02 sigue mock-only.
- D03 lane no toca D02 ni voice.

## Riesgos

- `main` debe protegerse antes de merges futuros.
- Auth real y secret manager siguen pendientes.
- Dialer necesita auditoria read-only separada.
- Dialer requiere hardening P0 antes de cualquier dispatch real.
- D03 requiere domain contracts en loop posterior.

## Branch Protection Recomendada

- Require pull request before merging.
- Require approvals.
- Require status checks.
- Require branch up to date.
- Restrict force pushes.
- Restrict deletions.
- Require conversation resolution.
- No direct push to `main`.

## Checklist

- [ ] CI verde.
- [ ] No deploy.
- [ ] No produccion.
- [ ] No datos reales.
- [ ] No secrets.
- [ ] No `_private`.
- [ ] No llamadas reales.
- [ ] No provider egress.
- [ ] No rutas reales de webhook.
- [ ] No ruta `/dispatch`.
- [ ] D03 lane sin DB/API/dashboard funcional.
- [ ] Reviewers asignados.
