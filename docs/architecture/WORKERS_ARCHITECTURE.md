# Workers Architecture

La capa `apps/workers` define la base de jobs asincronicos de Hyperion sin crear runtime real.

## Componentes

- `JobEnvelope`: contrato comun para jobs con `tenantId`, `actorId`, `correlationId`, prioridad,
  payload sanitizado, status y control de intentos.
- `InMemoryJobQueue`: cola local para pruebas y contratos. No reemplaza una cola distribuida.
- `InMemoryDeadLetterQueue`: captura jobs agotados o bloqueados en tests.
- `JobRegistry`: resuelve handlers por `JobType`.
- `WorkerRunner`: ejecuta `processNext` o `processAll(maxJobs)` de forma acotada. No crea daemon,
  intervalos ni procesos infinitos.
- `RetryPolicy`: controla intentos y backoff.
- `IdempotencyPolicy`: evita reejecutar jobs ya completados por `jobId` o `dedupeKey`.
- `WorkerRuntimeSafety`: evalua payloads contra policy gates antes de ejecutar handlers.

## Jobs seguros

- `outbox.process`: procesa outbox conceptual sin publicar a buses externos.
- `voice.call.prepare`: prepara una sesion de voz sin dispatch.
- `voice.call.event.process`: procesa eventos sinteticos sanitizados.
- `voice.post_call.process`: procesa resultados post-call ya redactados.
- `cedco_d02.readiness.evaluate`: evalua readiness sin runtime.
- `cedco_d02.compliance.evaluate`: evalua compliance no clinico sin LLM.
- `cedco_d02.metric.record`: registra metricas conceptuales en fake/in-memory.

## Futuro

Redis, BullMQ o una cola distribuida pueden entrar en un loop posterior, despues de estabilizar
runtime, adapters, runbooks, secrets y controles de produccion. Esta base deja puertos y contratos
para migrar sin contaminar el dominio.
