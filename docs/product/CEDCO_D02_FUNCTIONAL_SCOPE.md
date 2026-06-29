# CEDCO D02 - Alcance funcional

## Alcance

CEDCO D02 no es solo ejecutar llamadas. El producto completo cubre el ciclo de vida operativo de una
llamada outbound segura:

- Consentimiento y trazabilidad de autorizacion.
- Elegibilidad y contactabilidad antes de llamar.
- Cumplimiento de reglas horarias, habeas data y politicas de tenant.
- Intencion segura de llamada.
- Idempotencia.
- Dispatch controlado.
- Eventos de proveedor.
- Post-call.
- Auditoria.
- Metricas.
- Dashboard operativo.
- Reportes.
- Activacion de proveedor.
- Telyaco/DDI.
- Agente ElevenLabs.
- Primera llamada controlada.

## Estado actual

| Area                         | Estado                 | Evidencia                                                                  |
| ---------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Consentimiento sintetico     | STAGING DONE           | Payload D02 dry-run exige `consent.granted=true` y `consent_ref`.          |
| Elegibilidad/contactabilidad | PARTIAL                | Contratos y rutas existen; falta validacion con datos persistentes reales. |
| Cumplimiento                 | PARTIAL                | Politicas y blockers existen; falta matriz final del tenant.               |
| Intencion segura             | PARTIAL                | Evals y contratos existen; falta prueba end-to-end con guion aprobado.     |
| Idempotencia                 | STAGING DONE           | Platform to dialer dry-run valida replay/conflict sin llamadas reales.     |
| Dispatch                     | STAGING DONE           | Dispatch live queda bloqueado por policy gate.                             |
| Eventos de proveedor         | NOT STARTED            | Solo mock/staging sin proveedor real.                                      |
| Post-call                    | PARTIAL                | Modelo y persistencia existen; falta evento real sanitizado.               |
| Auditoria                    | PARTIAL                | Prisma-backed audit existe; falta politica final de retencion.             |
| Metricas                     | PARTIAL                | Modelo y resumen existen; falta dashboard operativo.                       |
| Dashboard                    | NOT STARTED            | Se documenta gap separado.                                                 |
| Reportes                     | NOT STARTED            | Requiere datos persistentes y criterios CEDCO.                             |
| Provider activation          | BLOCKED BY HUMAN INPUT | Requiere inputs de ElevenLabs/Telyaco/DDI.                                 |
| Telyaco/DDI                  | BLOCKED BY HUMAN INPUT | Requiere inventario de numeros y SIP.                                      |
| ElevenLabs agent             | BLOCKED BY HUMAN INPUT | Requiere cuenta, voz, agente, guion y politica de grabacion.               |
| Primera llamada controlada   | BLOCKED BY HUMAN INPUT | Requiere egress, numero real y aprobacion explicita.                       |

## No objetivos actuales

- No provider egress.
- No llamadas reales.
- No ElevenLabs real.
- No Telyaco real.
- No numeros reales.
- No secretos reales.
