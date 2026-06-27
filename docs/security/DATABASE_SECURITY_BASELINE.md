# Database Security Baseline

La capa de base de datos mantiene los principios de seguridad definidos en los dominios.

## Controles base

- `tenantId` obligatorio en modelos operativos para aislamiento multi-tenant.
- RBAC se aplicara en la capa de aplicacion antes de llamar repositorios.
- `AuditLog` conserva actor, tenant, recurso, resultado y `correlationId`.
- Metadata pasa por sanitizacion antes de persistirse.
- No PII por defecto.
- No secretos.
- No transcript crudo.
- No audio URL cruda.
- No telefono real como columna o metadata persistida.

## Eventos y trazabilidad

Los eventos principales conservan `correlationId`. `OutboxEvent` permite publicar eventos internos
de forma controlada en loops posteriores.

## Produccion futura

Antes de produccion se requieren politicas de retencion, cifrado, backups, monitoreo de accesos,
rotacion de credenciales, migraciones revisadas y HMAC/webhook validation en los adapters/runtime
correspondientes.

## Fuera de alcance

Este loop no conecta a PostgreSQL real, no ejecuta migraciones contra infraestructura, no crea API,
no abre puertos y no despliega.
