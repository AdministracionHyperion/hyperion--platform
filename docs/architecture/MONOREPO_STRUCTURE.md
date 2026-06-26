# Monorepo Structure

## Proposito

Este monorepo crea la base tecnica de Hyperion Platform sin desarrollar producto todavia. La
arquitectura documentada mantiene a Hyperion como control plane, ElevenLabs como managed voice
runtime futuro y SIP trunk / proveedor DID como transporte telefonico futuro.

No hay runtime activo en este loop.

## Apps

### `apps/api`

Boundary de API de plataforma. En este loop solo contiene un placeholder TypeScript para verificar
compilacion. No crea servidor, endpoints, puertos, autenticacion real ni integraciones.

### `apps/web`

Boundary de dashboard/web. En este loop solo contiene un placeholder TypeScript. No crea UI real,
Next.js, rutas, componentes de producto ni llamadas a APIs.

### `apps/workers`

Boundary para workers futuros. En este loop solo contiene un placeholder TypeScript. No crea colas,
jobs, cron, dispatch de llamadas ni procesos de background.

## Packages

### `packages/config`

Contratos futuros de configuracion tipada. No contiene secretos ni carga `.env`.

### `packages/db`

Boundary de persistencia futura. No contiene base de datos real, Prisma schema, migraciones ni
clientes de conexion.

### `packages/shared`

Utilidades y tipos compartidos de bajo nivel. Incluye el test minimo de sanidad del workspace.

### `packages/auth`

Boundary compartido para autenticacion/autorizacion futura. No implementa proveedores de identidad
ni sesiones reales.

### `packages/observability`

Boundary compartido para logging, metricas y trazas futuras. No emite telemetria real.

### `packages/testing`

Boundary para utilidades de prueba futuras. No define smoke tests ni e2e.

### `packages/ui`

Boundary para primitivas UI futuras. No implementa dashboard real.

## Modules / Core

### `modules/core/tenancy`

Aislamiento multi-tenant y lifecycle de tenant.

### `modules/core/identity-access`

Actores, roles, permisos y aprobaciones.

### `modules/core/audit`

Audit log, trazabilidad, `tenantId` y `correlationId`.

### `modules/core/event-bus`

Lenguaje de eventos internos sin seleccionar broker todavia.

### `modules/core/feature-flags`

Flags de plataforma, incluido egress real apagado por defecto.

### `modules/core/versioning`

Versionado de agentes, prompts, flujos y bases de conocimiento.

### `modules/core/feedback`

Pipeline futuro de feedback sobre datos sanitizados.

## Modules / Agent Platform

### `modules/agent-platform/agent-builder`

Construccion y administracion futura de agentes.

### `modules/agent-platform/prompt-management`

Gestion futura de prompts, plantillas, aprobaciones y versiones.

### `modules/agent-platform/flow-management`

Flujos conversacionales y reglas configurables.

### `modules/agent-platform/knowledge-rag`

Bases de conocimiento, ingestion futura y RAG.

### `modules/agent-platform/evals`

Evaluaciones futuras. No hay evals en este loop.

## Modules / Voice

### `modules/voice/voice-core`

Lenguaje comun del dominio de voz, independiente de proveedor.

### `modules/voice/call-orchestration`

Lifecycle futuro de solicitudes y llamadas.

### `modules/voice/telephony`

Contratos internos de telefonia, incluido `CallProviderPort` futuro.

### `modules/voice/speech`

Boundary de STT/TTS y voz futura. Hyperion no transporta audio en fase 1.

### `modules/voice/handoff`

Transferencia a humano por reglas. PBX e inbound quedan fuera de fase 1.

## Modules / Integrations

### `modules/integrations/scheduling`

Integraciones futuras de agenda.

### `modules/integrations/eps-eligibility`

Validaciones futuras de EPS/convenios sin datos reales en este loop.

### `modules/integrations/crm`

Conectores futuros a CRM.

### `modules/integrations/documents`

Integraciones futuras con documentos y bases documentales.

### `modules/integrations/provider-adapters`

Adapters futuros a proveedores externos. ElevenLabs SIP trunk sera un adapter futuro, no creado en
este loop.

## Modules / Products

### `modules/products/cedco/d02-calls`

Composicion futura del vertical CEDCO D02 llamadas. Puede depender de core, agent-platform y voice,
pero no al reves.

## `_private/`

`_private/` contiene documentos locales de referencia y no se commitea. La documentacion en `docs/`
debe ser limpia y sanitizada; no copia costos, datos reales, secretos ni texto largo literal de los
Word fuente.

## Por que no hay runtime todavia

Este loop crea foundation tecnica, no features. El orden aprobado sigue siendo:

1. Dominio.
2. Contratos.
3. Persistencia.
4. Adapters.
5. Seguridad.
6. Observabilidad.
7. Evals.
8. Integracion.
9. Smoke final.

Crear runtime ahora mezclaria foundation con producto, proveedores y smoke-first.
