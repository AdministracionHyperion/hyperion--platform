# API Security Baseline

La seguridad de este loop es contractual y orientada a tests. No reemplaza autenticacion real.

## Controles actuales

- `tenantId` se valida en path con el value object del Core.
- `x-actor-id` y `x-actor-roles` son obligatorios en rutas protegidas.
- RBAC usa roles y permisos del dominio Core.
- `correlationId` se conserva o se genera.
- Zod valida params y bodies.
- Payloads con campos prohibidos se rechazan.
- CEDCO D02 usa allowlists de metadata por endpoint sensible.
- Metadata se sanitiza antes de responder desde servicios fake.
- Metadata se sanitiza antes de persistir desde servicios Prisma.
- Request logging no registra bodies crudos ni headers sensibles.
- Audit events de rutas protegidas se sanitizan antes de memoria o Prisma.
- Policy gates bloquean acciones runtime peligrosas por defecto.
- Rate limits in-memory protegen rutas publicas y protegidas.
- Errores no exponen stack traces.
- `API_SERVICES_MODE` bloquea fake services en produccion.
- `AUTH_MODE` bloquea `header-dev` en produccion y exige `local-staging` o `jwt-required`.
- `jwt-required` valida Bearer JWT RS256 cuando hay JWKS o public key ref configurado.

## Datos prohibidos

El API no acepta telefonos reales, transcripciones crudas, URLs crudas de audio, secretos ni keys de
proveedores. CEDCO D02 tampoco acepta historia clinica real ni datos de pacientes reales.

## Limites

No hay OAuth, rate limit distribuido ni mTLS. En produccion, `AUTH_MODE=jwt-required` requiere
`AUTH_JWKS_URL` o `AUTH_JWT_PUBLIC_KEY_REF`; sin esa referencia el runtime bloquea rutas protegidas.
Los integration tests usan PostgreSQL efimero y no conectan bases externas. Esos controles entran
despues de que la superficie contractual este estable.
