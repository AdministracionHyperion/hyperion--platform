# Hyperion Workers

`apps/workers` contiene la base contractual para jobs asincronicos de Hyperion.

## Estado

- JobEnvelope, JobId, JobType, JobStatus y JobPriority.
- Cola in-memory para tests y desarrollo local controlado.
- Dead-letter queue in-memory.
- RetryPolicy e IdempotencyPolicy.
- JobRegistry y WorkerRunner no-daemon.
- Jobs seguros para outbox, Voice y CEDCO D02.
- Jobs mock para sesion de llamada sintetica y flujo CEDCO D02 mock.
- Observability con logs y metricas in-memory.
- Policy gates antes de ejecutar payloads peligrosos.

No hay Redis, BullMQ, daemon real, adapter de proveedor, llamadas reales, runtime de voz, DB
externa, deploy ni procesos infinitos.

## Tests

```bash
pnpm test:workers
```

Los tests no abren puertos, no ejecutan `server.listen`, no hacen red y no usan proveedores reales.
