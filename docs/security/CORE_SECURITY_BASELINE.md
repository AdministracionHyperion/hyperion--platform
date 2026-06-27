# Core Security Baseline

## Tenant isolation

Todo recurso core que tenga `tenantId` debe validarse contra el `tenantId` de `OperationContext`
antes de ser usado por un caso de uso. `TenantIsolationPolicy` rechaza acceso cruzado con error de
aislamiento.

## RBAC

Identity Access define roles y permisos base:

- `super-admin`: acceso total.
- `tenant-admin`: administracion del tenant.
- `voice-manager`: configuracion y operacion de voz.
- `voice-operator`: operacion de llamadas y handoffs.
- `tenant-viewer`: lectura.
- `auditor`: lectura de auditoria y metricas.

`authorizeActorAction` compara `ActorContext`, `OperationContext` y permiso requerido. Si el actor
no coincide o el rol no permite la accion, devuelve `AuthorizationError`.

## Audit log

`AuditEvent` registra:

- `tenantId`.
- `actorId`.
- `correlationId`.
- accion.
- recurso.
- resultado.
- metadata sanitizada.
- timestamp.

`recordAuditEvent` siempre requiere `OperationContext` y siempre aplica sanitizacion antes de
guardar.

## CorrelationId

`OperationContext` exige `correlationId` no vacio. El `correlationId` viaja en audit events,
feedback events y event envelopes para trazabilidad transversal.

## Metadata sanitization

`SafeMetadata` redacta claves sensibles, incluyendo:

- `phone`.
- `phoneNumber`.
- `to_number`.
- `email`.
- `document`.
- `documentNumber`.
- `password`.
- `secret`.
- `token`.
- `apiKey`.
- `rawTranscript`.
- `transcript`.
- `audioUrl`.
- `recordingUrl`.

La redaccion usa un valor comun: `[REDACTED]`.

## No PII by default

El core no requiere telefonos, emails, documentos, raw transcript ni audio crudo. Si algun payload
incluye claves sensibles por error, la metadata se redacta antes de audit o feedback.

## No secrets

El core no contiene API keys, tokens reales, agent IDs reales, phone number IDs reales, numeros
reales, datos reales ni `.env` con secretos.

`tools/secret-scan.mjs` sigue ejecutandose dentro de `pnpm check`.

## No process.env en dominio

El dominio core no lee variables de entorno. Feature flags se evaluan desde un puerto de
repositorio, no desde configuracion de proceso.

`tools/boundary-check.mjs` falla si detecta `process.env` en `modules/core/**/*.ts`.

## Proveedores externos

ElevenLabs, SIP trunk, Twilio, PBX y proveedores reales siguen fuera del dominio core. Cualquier
integracion futura debe entrar por puertos/adapters despues de dominio, contratos, persistencia,
seguridad y observabilidad.
