# Worker Security Baseline

Workers queda cerrado por defecto.

## Bloqueos

- No real calls.
- No provider egress.
- No production deploy.
- No raw transcript.
- No raw recording ni audio URL cruda.
- No phone real.
- No secrets.
- No datos de paciente reales.
- No R03 ni activos fijos.

## Observability

Los jobs registran logs y metricas in-memory. Los logs usan metadata sanitizada y preservan
`tenantId`, `actorId` y `correlationId` cuando existen.

## Policy gates

Antes de ejecutar un handler, el runner inspecciona payloads y evalua acciones peligrosas con los
policy gates de Core. Los defaults mantienen flags sensibles en `false`.

## Limitaciones

La cola es in-memory y no distribuida. No hay lock distribuido, persistencia de jobs ni reintentos
entre procesos. Es intencional para este loop.
