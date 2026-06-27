# Operational Dashboard Security Baseline

El dashboard operacional nace como superficie de observacion, no de control.

## Controles

- Solo rutas GET.
- Sin dispatch.
- Sin real call button habilitado.
- Sin provider egress button habilitado.
- Sin production deploy button habilitado.
- Sin acceso a audio crudo.
- Sin export de transcript crudo.
- Sin data export.
- Sin URLs externas.
- Sin SDKs de proveedor.

## Datos

Los read models sanitizan payloads antes de renderizar o responder. Se bloquean o eliminan campos de
telefono, transcript crudo, audio, payload crudo, email, documento, credenciales y provider IDs
reales.

## UI

El panel de controles futuros muestra botones deshabilitados. No tienen handlers funcionales ni
llaman a la API. La UI solo consume rutas internas relativas de dashboard y rechaza URLs externas en
el cliente.

## Audit y metricas

Las lecturas protegidas conservan `tenantId`, `actorId` y `correlationId`. Los logs no contienen
bodies crudos ni headers sensibles. Las metricas son snapshots internos sanitizados.

## Limites

Este loop no configura autenticacion real, RBAC productivo ni dashboard deployado. Es una base
operacional mock-only que debe mantenerse cerrada hasta que existan runbooks, approvals, secret
manager y provider configuration futuros.
