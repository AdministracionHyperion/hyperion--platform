# CEDCO D02 - Rollback

## Objetivo

Volver a un estado seguro si una integracion futura de llamadas outbound presenta fallo tecnico, fallo de seguridad o comportamiento operativo no aprobado.

## Acciones inmediatas

1. Deshabilitar flag de llamadas reales.
2. Detener workers de dispatch real si existen.
3. Mantener mock provider disponible para desarrollo local.
4. Bloquear nuevas solicitudes con razon `real_calls_disabled`.
5. Revisar audit log por `tenantId` y `correlationId`.
6. Invalidar credenciales afectadas si hubo exposicion.
7. Registrar incidente y causa probable.

## Reversion de configuracion

- Volver a configuracion de proveedor mock.
- Retirar endpoint webhook publico si aplica.
- Rotar webhook secret si aplica.
- Confirmar que no quedan API keys en archivos locales commiteables.
- Confirmar que no hay telefonos reales en logs.

## Criterios para reintentar

- Causa raiz entendida.
- Fix revisado.
- Sanitizer validado.
- Logs limpios.
- Evals aprobados.
- Runbook actualizado.
- Nueva aprobacion humana explicita.
