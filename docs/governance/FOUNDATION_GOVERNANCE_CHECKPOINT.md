# Foundation Governance Checkpoint

## Estado

- Rama oficial de trabajo actual: `foundation/cedco-d02-sip-first-architecture`.
- Estado: foundation mock-only avanzada.
- Ultimo checkpoint remoto esperado:
  `6e07637 feat(dashboard): add operational mock dashboard skeleton`.

## Existe

- Core Platform.
- Agent Platform.
- Voice Platform.
- CEDCO D02 Domain.
- Prisma/PostgreSQL baseline.
- API + Prisma wiring controlado.
- Observability, audit hooks y request logging.
- Policy gates, rate limits y runtime blockers.
- Workers foundation con runner in-memory.
- Mock call runtime end-to-end.
- Mock provider event ingestion y post-call sanitizer.
- CEDCO D02 deterministic eval suite.
- Operational dashboard skeleton solo lectura.
- CI remoto con `verify`, `db-integration` y `api-integration`.

## No Existe

- Produccion.
- Deploy.
- Llamadas reales.
- Provider egress.
- ElevenLabs real.
- SIP real.
- Auth real.
- Secret manager.
- Workers daemon reales.
- Branch protection configurada automaticamente por Codex.

## Riesgo Principal

`main` no representa todavia el trabajo real de la foundation. La rama foundation contiene la base
avanzada y debe entrar a `main` solo por PR revisado, con CI verde y sin merge automatico.

## Proxima Accion Recomendada

Abrir PR de `foundation/cedco-d02-sip-first-architecture` hacia `main`, describiendo claramente que
la foundation es mock-only y que no habilita produccion, llamadas reales, provider egress ni deploy.
