# Hyperion Platform

Repositorio limpio para la plataforma multi-tenant de agentes de IA Hyperion.

El primer vertical priorizado es CEDCO R02 / D02 llamadas. R03 queda fuera del alcance actual.

La carpeta `_private/` contiene fuentes locales de referencia no commiteables y no debe subirse a
GitHub.

## Monorepo

Este repositorio usa pnpm workspaces, TypeScript, Vitest, ESLint y Prettier.

Estructura base:

- `apps/api`: skeleton HTTP contractual con Fastify, sin runtime de llamadas todavia.
- `apps/evals`: runner local de evals deterministicas, sin LLM ni proveedor real.
- `apps/web`: skeleton de dashboard operacional solo lectura, sin acciones reales.
- `apps/workers`: base contractual de workers con cola in-memory, sin daemon real todavia.
- `packages/*`: paquetes compartidos de plataforma.
- `modules/*`: bounded contexts de dominio y producto.
- `tools/`: herramientas locales de validacion.

## Scripts

- `pnpm check`: ejecuta formato, lint, Prisma checks, typecheck, tests, secret scan, architecture
  check, DB schema check y repo guard.
- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: ejecuta TypeScript sin emitir archivos.
- `pnpm test`: ejecuta Vitest.
- `pnpm test:evals`: ejecuta la suite deterministica de evals CEDCO D02.
- `pnpm evals:cedco-d02`: ejecuta el gate local de evals CEDCO D02.
- `pnpm test:workers`: ejecuta los tests unitarios de workers foundation.
- `pnpm secret:scan`: revisa patrones obvios de secretos en archivos trackeables.
- `pnpm run repo:guard`: bloquea `_private`, R03/activos fijos, `.env` reales, proveedores reales,
  runtime indebido y columnas Prisma prohibidas.

## Observabilidad

La API tiene logs estructurados, redaccion centralizada, metricas in-memory y audit events para
rutas protegidas. No hay exporter externo, APM, dashboard ni runtime de llamadas.

## Seguridad Operativa

La API aplica rate limits in-memory, policy gates y runtime blockers. Los defaults bloquean llamadas
reales, egress de proveedor, production deploy, raw transcript, raw recording y data export. No hay
Redis, BullMQ ni rate limit distribuido todavia.

## Workers

Workers tiene contratos de jobs, cola in-memory, retry, dead-letter, idempotencia local y runner
acotado para tests. No hay daemon real, Redis, BullMQ, provider egress ni llamadas reales.

## Mock Runtime

CEDCO D02 tiene un flujo mock end-to-end para simular intent, readiness, sesion de llamada, eventos
sinteticos, post-call sanitizado, audit, metricas y persistencia segura. Sigue sin haber llamadas
reales, provider egress, ElevenLabs, SIP ni numeros reales.

La ingestion mock de eventos de proveedor normaliza eventos post-call sinteticos con firma de test,
replay protection in-memory, sanitizacion estricta y persistencia segura reutilizando tablas
existentes. No hay webhook real ni payload crudo persistido.

## Evals

CEDCO D02 tiene una suite deterministica que valida readiness, compliance, scheduling, eligibility,
orientation, handoff, payloads inseguros, limites clinicos, runtime mock y mock provider event
ingestion. No usa LLM real, provider real, SIP, numeros reales, datos reales, red externa ni DB
externa.

## Governance y Carriles Paralelos

La foundation tiene docs de governance para PR hacia `main`, branch protection requerida,
contributor workflow y workstreams paralelos. CEDCO D03 fixed assets tiene un carril minimo
habilitado en `modules/products/cedco/d03-fixed-assets`, con contratos de dominio iniciales y sin
DB, API, dashboard, workers, migraciones ni datos reales.

El intake de dialer queda documentado como auditoria read-only fuera de este repo. No se debe copiar
snapshot crudo, `.env`, logs, audios, transcripts, dumps, certificados ni backups.

La decision de integracion del dialer es hibrida: Hyperion solo cruza por `InternalDialerAdapter`,
bloqueado por defecto. No se usan endpoints demo/campaign-start, ElevenLabs directo, SIP directo ni
Twilio directo.

Las primeras superficies del dialer son solo readiness y dry-run. Exponen el estado P0 y validan
solicitudes sinteticas por el adapter bloqueado; no hacen dispatch ni provider egress.

## Dashboard

`apps/web` contiene un dashboard operacional skeleton solo lectura para observar mock runtime, mock
provider events, audit, metricas, policy gates, rate limits y evals. No hay dispatch, provider
egress, botones peligrosos habilitados, rutas reales de webhook, llamadas reales ni datos reales.

## CI

GitHub Actions ejecuta `CI / Verify` en pushes a `main`, pushes a `foundation/**`, pull requests
hacia `main` y ejecuciones manuales. El workflow usa `pnpm install --frozen-lockfile` y los quality
gates locales, sin secrets, sin DB real, sin deploy y sin llamadas reales.

## Estado actual

La base tecnica existe con API HTTP contractual, wiring Prisma controlado, observabilidad segura,
policy gates, workers foundation in-memory, runtime mock end-to-end, ingestion mock de eventos,
evals deterministicas y dashboard operacional solo lectura, pero sin runtime real de producto. CEDCO
R02 / D02 llamadas sigue siendo el unico vertical activo. R03/activos fijos queda fuera de alcance.
No hay workers daemon reales, adapter ElevenLabs, adapter SIP, webhook real de proveedor, llamadas,
proveedores activos, produccion ni deploy.
