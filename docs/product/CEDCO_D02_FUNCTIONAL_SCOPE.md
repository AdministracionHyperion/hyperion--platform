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

| Area                         | Estado                 | Evidencia                                                                      |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| Consentimiento sintetico     | STAGING DONE           | Payload D02 dry-run exige `consent.granted=true` y `consent_ref`.              |
| Elegibilidad/contactabilidad | STAGING DONE           | API persiste checks mock/integration_required sin validacion real de derechos. |
| Cumplimiento                 | STAGING DONE           | Matriz de controles D02 en reporte operacional y policy gates activos.         |
| Intencion segura             | STAGING DONE           | Clasificador deterministico y suite D02 completa en dashboard/reporte.         |
| Idempotencia                 | STAGING DONE           | Platform to dialer dry-run valida replay/conflict sin llamadas reales.         |
| Dispatch                     | STAGING DONE           | Dispatch live queda bloqueado por policy gate.                                 |
| Eventos de proveedor         | STAGING DONE           | Ingestion mock sanitizada, replay-aware y sin provider egress.                 |
| Post-call                    | STAGING DONE           | Mock flow persiste resultado post-call sanitizado y handoff recomendado.       |
| Auditoria                    | STAGING DONE           | Prisma-backed audit preview sanitizado por tenant y correlacion.               |
| Metricas                     | STAGING DONE           | Metricas D02 persistidas y snapshot seguro en dashboard/reporte.               |
| Dashboard                    | STAGING DONE           | HTML/API D02 seguro con sesiones mock, eventos, evals, auditoria y metricas.   |
| Reportes                     | STAGING DONE           | Reporte operacional CEDCO D02 generado desde el read model seguro.             |
| Provider activation          | BLOCKED BY HUMAN INPUT | Requiere inputs de ElevenLabs/Telyaco/DDI.                                     |
| Telyaco/DDI                  | BLOCKED BY HUMAN INPUT | Requiere inventario de numeros y SIP.                                          |
| ElevenLabs agent             | BLOCKED BY HUMAN INPUT | Requiere cuenta, voz, agente, guion y politica de grabacion.                   |
| Primera llamada controlada   | BLOCKED BY HUMAN INPUT | Requiere egress, numero real y aprobacion explicita.                           |

## No objetivos actuales

- No provider egress.
- No llamadas reales.
- No ElevenLabs real.
- No Telyaco real.
- No numeros reales.
- No secretos reales.
- PBX queda fuera del cierre actual hasta abrir su gate separado.
