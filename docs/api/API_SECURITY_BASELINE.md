# API Security Baseline

La seguridad de este loop es contractual y orientada a tests. No reemplaza autenticacion real.

## Controles actuales

- `tenantId` se valida en path con el value object del Core.
- `x-actor-id` y `x-actor-roles` son obligatorios en rutas protegidas.
- RBAC usa roles y permisos del dominio Core.
- `correlationId` se conserva o se genera.
- Zod valida params y bodies.
- Payloads con campos prohibidos se rechazan.
- Metadata se sanitiza antes de responder desde servicios fake.
- Metadata se sanitiza antes de persistir desde servicios Prisma.
- Request logging no registra bodies crudos ni headers sensibles.
- Audit events de rutas protegidas se sanitizan antes de memoria o Prisma.
- Errores no exponen stack traces.

## Datos prohibidos

El API no acepta telefonos reales, transcripciones crudas, URLs crudas de audio, secretos ni keys de
proveedores. CEDCO D02 tampoco acepta historia clinica real ni datos de pacientes reales.

## Limites

No hay auth real, sesiones, cookies, OAuth, rate limit ni mTLS. Los integration tests usan
PostgreSQL efimero y no conectan bases externas. Esos controles entran despues de que la superficie
contractual este estable.
