# CEDCO D02 - Checklist MVP

## MVP demo funcional

| Item                        | Estado                 | Criterio                                                                     |
| --------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Platform API staging        | STAGING DONE           | Health OK en loopback.                                                       |
| Dialer staging dry-run      | STAGING DONE           | Readiness, dry-run, replay, conflict y dispatch blocked pasan.               |
| Platform -> dialer          | STAGING DONE           | D02 dry-run via platform devuelve `dry_run_accepted`.                        |
| DB platform staging         | STAGING DONE           | Prisma migrations aplicadas en DB aislada.                                   |
| Idempotencia dialer durable | STAGING DONE           | Dialer usa Postgres staging.                                                 |
| Provider egress             | BLOCKED BY HUMAN INPUT | Debe seguir false hasta aprobacion explicita.                                |
| Live calls                  | BLOCKED BY HUMAN INPUT | Debe seguir false hasta primera llamada controlada.                          |
| Auth staging real           | STAGING DONE           | `local-staging`/`jwt-required` cubren staging; `header-dev` solo local/test. |
| Dashboard minimo            | STAGING DONE           | HTML/API read-only cubre sesiones, eventos, errores y auditoria.             |
| Eventos post-call           | STAGING DONE           | Ingestion mock, post-call y replay safety con fixtures.                      |
| Reporte CEDCO               | STAGING DONE           | Endpoint de reporte operacional con KPIs y exclusiones.                      |

## Minimo antes de provider-adjacent

- DB/auth staging aislado documentado.
- Idempotencia durable validada.
- Provider inventory sin secretos.
- Plan de activacion ElevenLabs/Telyaco aprobado.
- Egress sigue apagado por defecto.
- Rollback de staging ensayado.

## Minimo antes de primera llamada real

- API key runtime segura.
- SIP/DDI runtime seguro.
- Agente real creado y aprobado.
- Caller ID permitido.
- Consentimiento de caso de prueba real.
- Ventana horaria legal.
- Observabilidad y rollback activos.
- Aprobacion humana explicita.
