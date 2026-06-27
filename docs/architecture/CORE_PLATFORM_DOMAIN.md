# Core Platform Domain

## Proposito

Core Platform Domain es la primera capa reusable de Hyperion Platform. Define entidades, contratos,
politicas y puertos transversales que pueden ser usados por CEDCO D02 y futuros productos sin
acoplar el dominio a proveedores, API HTTP, base de datos o runtime de llamadas.

Este loop cubre dominio y contratos core. Persistencia real, adapters, seguridad avanzada,
observabilidad, evals, integracion y smoke final quedan para loops posteriores.

## Shared core contracts

`packages/shared/src/core` contiene:

- `Result<T, E>` con helpers `ok`, `fail`, `isOk` e `isFail`.
- `DomainError` y codigos de error comunes.
- `CorrelationId` y helper `createCorrelationId`.
- Validacion de identificadores seguros para IDs no PII.
- `OperationContext` con `tenantId`, `actorId`, `correlationId`, `occurredAt` y `source`.
- `SafeMetadata`, sanitizacion y redaccion de claves sensibles.
- Helpers de tiempo.

## Tenancy

`modules/core/tenancy` representa:

- `TenantId`.
- `Tenant`.
- `TenantSettings`.
- `TenantMembership`.
- `TenantStatus`.
- `TenantContext`.
- `TenantIsolationPolicy`.

Puerto:

- `TenantRepositoryPort`.

Use cases:

- `createTenant`.
- `resolveTenantContext`.

Tenancy valida aislamiento por `tenantId` y no conoce productos ni integraciones.

## Identity Access

`modules/core/identity-access` representa:

- `ActorId`.
- `Actor`.
- `ActorContext`.
- Roles base: `super-admin`, `tenant-admin`, `voice-manager`, `voice-operator`, `tenant-viewer`,
  `auditor`.
- Permisos base de tenant, agentes, voz, audit, feedback y versionado.
- `AuthorizationError`.
- `RbacPolicy`.

Use case:

- `authorizeActorAction`.

Regla clave: `super-admin` puede todo; roles de tenant y voz solo reciben permisos acordes a su
responsabilidad.

## Audit

`modules/core/audit` representa:

- `AuditEvent`.
- `AuditAction`.
- `AuditResource`.
- `AuditResult`.
- Sanitizador de metadata.

Puerto:

- `AuditLogPort` con `append(event)` y `findByTenant(tenantId)`.

Use case:

- `recordAuditEvent`.

Audit siempre requiere `OperationContext` y siempre sanitiza metadata antes de guardar.

## Event Bus

`modules/core/event-bus` representa:

- `DomainEvent`.
- `EventEnvelope`.
- `EventBusPort`.
- `InMemoryEventBus` para tests.

El envelope incorpora `tenantId`, `actorId` y `correlationId` desde `OperationContext`.

No hay broker, cola ni infraestructura de produccion en este loop.

## Feature Flags

`modules/core/feature-flags` representa:

- `FeatureFlag`.
- `FeatureFlagScope`.

Puerto:

- `FeatureFlagRepositoryPort`.

Use case:

- `evaluateFeatureFlag`.

Regla clave: una flag tenant-scoped gana sobre la global. Si no existe ninguna flag, el resultado
por defecto es `false`. No depende de variables de entorno.

## Versioning

`modules/core/versioning` representa:

- `VersionId`.
- `VersionStatus`.
- `VersionedResource`.

Puerto:

- `VersionRepositoryPort`.

Use cases:

- `createVersionDraft`.
- `activateVersion`.
- `archiveVersion`.

Reglas:

- `versionNumber` incremental por `tenantId + resourceType + resourceId`.
- Solo una version puede estar `active` para un recurso de tenant.
- Activar una version archiva la activa anterior.
- Archivar no borra historico.

## Feedback

`modules/core/feedback` representa:

- `FeedbackEvent`.
- `FeedbackOutcome`.
- `FeedbackSource`.

Puerto:

- `FeedbackRepositoryPort`.

Use case:

- `recordFeedbackEvent`.

Feedback requiere `tenantId` y `correlationId`, sanitiza metadata y puede publicar evento de dominio
si se inyecta `EventBusPort`.

## Testing support

`packages/testing/src/core` contiene repositorios en memoria para tests unitarios:

- `InMemoryTenantRepository`.
- `InMemoryAuditLog`.
- `InMemoryFeatureFlagRepository`.
- `InMemoryVersionRepository`.
- `InMemoryFeedbackRepository`.
- `createTestOperationContext`.
- `createTestActorContext`.

Estos fakes no son persistencia real ni adapters.

## Boundary guard

`tools/boundary-check.mjs` valida:

- `modules/core` no importa `modules/products` ni `modules/integrations`.
- `modules/agent-platform` no importa `modules/products`.
- `modules/voice` no importa `modules/products`.
- No hay imports de proveedores reales en core, agent-platform, voice ni el producto CEDCO D02.
- No hay `process.env` en dominio core.

El script se ejecuta con `pnpm run architecture:check` y dentro de `pnpm check`.

## Conexion futura con CEDCO D02

CEDCO D02 debera componer este core de forma externa:

- `Tenant` y `TenantContext` para aislamiento.
- `ActorContext` y RBAC para autorizaciones.
- `AuditEvent` para trazabilidad.
- `DomainEvent` para comunicar cambios internos.
- `FeatureFlag` para bloquear egress real por defecto.
- `VersionedResource` para agentes, prompts y knowledge bases.
- `FeedbackEvent` para aprendizaje y revision.

CEDCO no debe introducir dependencias inversas hacia core.

## Todavia no existe

- Persistencia real.
- Prisma.
- PostgreSQL.
- API HTTP.
- Dashboard.
- Workers reales.
- Runtime CEDCO D02.
- Llamadas.
- ElevenLabs adapter.
- SIP real.
- Smoke tests.
- Evals.
- Proveedores reales.
