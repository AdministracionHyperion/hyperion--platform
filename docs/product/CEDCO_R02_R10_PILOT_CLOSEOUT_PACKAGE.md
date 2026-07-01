# CEDCO R02/R10 - Paquete de cierre de piloto

## Estado

Este documento cierra el entregable formal de R02 sobre el nucleo R10 para el alcance permitido:
plataforma operativa, dashboard, agenda, conocimiento/RAG, agente/versionado, simulacion,
gobernanza, reporte D02, roadmap de integraciones, modelo de soporte, SLA objetivo e indicadores.

No habilita PBX real, telefonia real continua, llamadas reales continuas, proveedor de voz real
nuevo, transcript/audio crudo, ni el vertical de inventario/activos de CEDCO.

## Fuentes de alcance

- `R00_Indice_Ingenieria.docx`: orden de verticales y prioridad CEDCO.
- `R02_CEDCO_AgenteVoz_Plataforma.docx`: piloto CEDCO agente de voz + plataforma.
- `R10_Plataforma_Hyperion_Nucleo.docx`: nucleo multi-tenant Hyperion.

Los Word fuente permanecen en `_private/source-docs` y no se versionan en Git.

## Entregables cerrados

| Entregable R02/R10               | Estado       | Evidencia                                                                |
| -------------------------------- | ------------ | ------------------------------------------------------------------------ |
| Tenant CEDCO operativo           | STAGING DONE | `AUTH_MODE=local-staging`, Prisma users/memberships/sessions.            |
| Dashboard R02 operador           | STAGING DONE | `/api/v1/tenants/cedco-demo/r02/dashboard`.                              |
| Agenda/citas internas            | STAGING DONE | Availability, appointments, reschedule, cancel y audit Prisma-backed.    |
| Google Calendar                  | STAGING DONE | Dry-run UI/API sin OAuth, credenciales ni mutacion externa.              |
| Conocimiento/RAG                 | STAGING DONE | Upload texto/PDF extraido, process, approve, activate y search-test.     |
| Agente/versionado                | STAGING DONE | Create, approve, activate y flow simulation sin mutar proveedor real.    |
| Handoff interno                  | STAGING DONE | Refs internas y reglas de handoff; provider-side enablement sigue gated. |
| Gobernanza/auditoria             | STAGING DONE | Audit events, tenant isolation, RBAC y policy gates.                     |
| Dashboard/reporte D02            | STAGING DONE | `/products/cedco/d02/dashboard` y `/reports/operational-summary`.        |
| Matriz de controles D02          | STAGING DONE | Auth, consentimiento, elegibilidad, intencion, handoff, egress y media.  |
| Roadmap tecnico de integraciones | STAGING DONE | Este documento define fases, owners, gates y criterio de entrada.        |
| Propuesta formal de piloto       | STAGING DONE | Alcance, arquitectura, fases, soporte, SLA e indicadores definidos aqui. |
| Publicacion GitHub               | STAGING DONE | PR #50 mergeado sobre `main` con CI verde.                               |
| Deploy Contabo staging           | STAGING DONE | Release `platform-d2559c1`; validaciones R02/D02 por loopback y HTTPS.   |

## Arquitectura entregada

Hyperion funciona como control plane multi-tenant:

- API Fastify con auth local-staging y JWT-required disponible para runtime con verificador.
- Prisma/PostgreSQL para tenant data, agenda, RAG, agente/versiones, audit y metricas D02.
- Policy gates para bloquear acciones peligrosas por defecto.
- Dashboard HTML read-only/action-safe para R02 y D02.
- Workers/jobs seguros para mock runtime y eventos sanitizados.
- Integraciones externas representadas por contratos, dry-runs o readiness gates.

## Roadmap tecnico de integracion

| Integracion                     | Estado actual             | Siguiente gate seguro                                   | Condiciones de entrada                                        |
| ------------------------------- | ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Google Calendar                 | Dry-run operator-ready    | `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`                 | OAuth/service account, calendar refs, rollback y test window. |
| CRM                             | Boundary/contrato futuro  | `APPROVE_CRM_STAGING_CONTRACT`                          | Campos permitidos, tenant mapping, no PII cruda, sandbox.     |
| ERP/agenda corporativa          | Boundary/contrato futuro  | `APPROVE_ERP_STAGING_CONTRACT`                          | API sandbox, mapping servicios/sedes, idempotencia.           |
| EPS/convenios                   | Mock/integration-required | `APPROVE_EPS_ELIGIBILITY_SANDBOX`                       | Catalogo CEDCO, respuesta sanitizada, no derechos reales.     |
| Bases documentales              | RAG texto aprobado        | `APPROVE_DOCUMENT_SOURCE_CONNECTOR_STAGING`             | Fuente aprobada, extraccion local, politica de versionado.    |
| Webhook metadata-only proveedor | Gated                     | `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`       | HMAC, replay, payload minimo, sin audio/transcript raw.       |
| Handoff provider-side           | Ref interna               | `APPROVE_PROVIDER_HANDOFF_TARGET_PERSISTENT_ENABLEMENT` | Route ref sanitizado, rollback y QA de transferencia.         |
| Telefonia/PBX real              | Excluido                  | Fuera de este cierre                                    | Requiere loop separado.                                       |
| Llamadas reales continuas       | Excluido                  | Fuera de este cierre                                    | Requiere aprobacion operacional separada.                     |
| Inventario/activos CEDCO        | Excluido                  | Fuera de este cierre                                    | Requiere vertical separado.                                   |

## Fases propuestas

| Fase | Objetivo                   | Resultado esperado                                          |
| ---- | -------------------------- | ----------------------------------------------------------- |
| 0    | Operacion staging segura   | Login, dashboard R02/D02, agenda, RAG, agente y reportes.   |
| 1    | Integraciones dry-run      | Calendar/CRM/ERP/EPS como contratos, fixtures y no egress.  |
| 2    | Sandbox controlado         | Una integracion no telefonica por gate y rollback ensayado. |
| 3    | Provider-adjacent metadata | Webhook metadata-only, sin llamada continua ni media cruda. |
| 4    | Piloto operativo limitado  | Operadores CEDCO usando dashboard con datos controlados.    |
| 5    | Produccion futura          | Solo con auth/secret manager/SLO/rollback aprobados.        |

## Modelo de soporte

| Nivel | Responsable      | Cobertura inicial       | Responsabilidad                                            |
| ----- | ---------------- | ----------------------- | ---------------------------------------------------------- |
| L1    | Operador CEDCO   | Horario piloto          | Revisar agenda, RAG, agente, handoff refs y reporte.       |
| L2    | Hyperion soporte | Ventana acordada piloto | Triage de errores, rollback, fixtures, DB/API health.      |
| L3    | Ingenieria       | Bajo incidente aprobado | Fix de codigo, migraciones, gates, integraciones sandbox.  |
| Sec   | Compliance/audit | Revision por entrega    | Verificar PII, roles, audio/transcript, egress y secretos. |

## SLA/SLO objetivo

Estos objetivos aplican a staging/piloto controlado, no a produccion contractual final.

| Area                | Objetivo piloto                | Medicion inicial                                      |
| ------------------- | ------------------------------ | ----------------------------------------------------- |
| API health          | 99% en ventana de demo         | `/health` y dashboard route checks.                   |
| Login local-staging | 99% en ventana de demo         | Login + whoami + logout.                              |
| Dashboard R02/D02   | < 2s respuesta HTML en staging | Probe HTTPS y loopback.                               |
| Agenda interna      | Sin perdida de writes en demo  | Create/read/reschedule/cancel + audit.                |
| RAG/operator KB     | Version activa trazable        | Document status + search source.                      |
| Policy gates        | 100% bloqueo de acciones no-go | Reporte D02 + tests + runtime flags.                  |
| Egress proveedor    | 0 eventos no aprobados         | Config flags + report scope + audit.                  |
| Datos sensibles     | 0 exposiciones conocidas       | Secret scan, blocked evidence regex, sanitizer tests. |
| Rollback            | < 15 min para volver release   | Symlink release + compose rebuild/restart.            |

## Indicadores de exito

- Operador autorizado entra por HTTPS y ve dashboard R02.
- Operador agenda, reprograma y cancela una cita interna con audit.
- RAG recibe contenido aprobado y responde una busqueda con fuente.
- Agente tiene version aprobada/activa y simula schedule, knowledge y handoff.
- D02 dashboard/reporte muestra sesiones mock, eventos, metricas, evals y controles.
- `realCallsEnabled=false`, `providerEgressEnabled=false`, `pbxRuntimeConnected=false`.
- No aparecen telefonos reales, raw transcript, audio URL, API keys, provider IDs reales ni secrets.
- CI y `pnpm check` pasan antes de deploy.
- Contabo staging responde por HTTPS en rutas permitidas.

## Evidencia de deploy

- Release activo: `/opt/hyperion-staging/releases/platform-d2559c1`.
- PR: `https://github.com/AdministracionHyperion/hyperion--platform/pull/50`.
- Validaciones:
  - `R02_STAGING_OPERATIONAL_VALIDATION_PASSED`.
  - `D02_STAGING_OPERATIONAL_REPORT_VALIDATION_PASSED`.
  - `D02_PUBLIC_HTTPS_VALIDATION_PASSED`.

## Blockers restantes

Estos blockers no impiden el cierre del alcance permitido; son gates separados:

- Provider egress real.
- Primera llamada real controlada.
- Llamadas reales continuas.
- Telefonia/PBX real.
- OAuth real de Google Calendar.
- CRM/ERP/EPS sandbox real.
- Transcript/audio beyond approved QA.
- Vertical CEDCO inventario/activos.

Cada gate requiere aprobacion explicita, credenciales por canal runtime seguro, rollback, auditoria
y validacion dedicada.
