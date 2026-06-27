# CEDCO D02 Domain

## Proposito

CEDCO D02 es el vertical de llamadas salientes/controladas para CEDCO sobre Hyperion Platform. Este
dominio compone Core Platform, Agent Platform y Voice Platform. El dominio no implementa runtime ni
proveedores reales; las capas superiores del repo ya agregan persistencia Prisma, API HTTP, workers
in-memory, mock runtime, mock provider events, evals y dashboard operacional solo lectura.

## Entidades

- `CedcoSite`: sede permitida para orientacion.
- `CedcoService`: servicio registrado y asociado a sedes.
- `CedcoAgreement`: convenio/EPS registrado y asociado a servicios.
- `CedcoD02Configuration`: configuracion del tenant para D02.
- `CedcoD02AgentRuntimeProfile`: referencias versionadas de Agent Platform.
- `CedcoSchedulingRequest`: solicitud mock o futura de agenda.
- `CedcoEligibilityCheck`: validacion mock o futura de derechos.
- `CedcoD02EvalScenario`: escenarios de evaluacion especificos.
- `CedcoD02Metric`: metricas conceptuales.

## Value objects

- `CedcoSiteId`.
- `CedcoServiceId`.
- `CedcoAgreementId`.
- `CedcoPatientContextRef`.
- `CedcoConsentRef`.
- `CedcoCallIntent`.
- `CedcoCallObjective`.
- `CedcoCallPurpose`.

Las referencias de paciente y consentimiento son alias seguros. No contienen documento, telefono,
email ni datos personales reales.

## Policies

- `CedcoCompliancePolicy`.
- `CedcoNoClinicalTriagePolicy`.
- `CedcoKnowledgePolicy`.
- `CedcoSchedulingPolicy`.
- `CedcoEligibilityPolicy`.
- `CedcoHandoffPolicy`.
- `CedcoOrientationPolicy`.

Estas politicas bloquean diagnostico, triage clinico, invencion de sedes/servicios/convenios, datos
reales, transcript crudo, audio crudo y confirmaciones reales sin integracion.

## Ports

- `CedcoSiteRepositoryPort`.
- `CedcoServiceRepositoryPort`.
- `CedcoAgreementRepositoryPort`.
- `CedcoD02ConfigurationRepositoryPort`.
- `CedcoSchedulingPort`.
- `CedcoEligibilityPort`.
- `CedcoD02MetricsPort`.

Los puertos de scheduling y eligibility son contratos futuros. En este loop solo existen fakes para
tests.

## Use cases

- `createCedcoD02Configuration`.
- `registerCedcoSite`.
- `registerCedcoService`.
- `registerCedcoAgreement`.
- `prepareCedcoD02CallContext`.
- `classifyCedcoCallIntent`.
- `evaluateCedcoCallReadiness`.
- `evaluateCedcoCompliance`.
- `evaluateCedcoHandoff`.
- `createCedcoSchedulingRequest`.
- `createCedcoEligibilityCheck`.
- `createCedcoD02EvalScenario`.
- `recordCedcoD02Metric`.
- `summarizeCedcoD02Readiness`.

## Composicion

Core aporta tenant isolation, RBAC, audit, feedback, correlationId y metadata segura.

Agent Platform aporta referencias versionadas: AgentVersion, PromptVersion, FlowVersion y
KnowledgeBaseVersion.

Voice Platform aporta CallSession, CallObjective, CallContext, CallId y handoff como contratos de
voz.

## Existe En Capas Superiores

- Persistencia Prisma/PostgreSQL baseline.
- API HTTP contractual con Fastify.
- Workers foundation in-memory, sin daemon real.
- Runtime mock end-to-end.
- Mock provider event ingestion.
- Evals deterministicas.
- Dashboard operacional solo lectura.

## Todavia no existe

- Workers reales.
- Runtime de llamadas.
- Adapter ElevenLabs.
- Adapter SIP real.
- Scheduling real.
- Eligibility real.
- LLM real.
- STT/TTS real.
- PBX.
- Inbound.
- Smoke tests.
