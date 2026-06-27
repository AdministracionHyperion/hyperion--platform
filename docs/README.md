# Hyperion Docs

Documentacion commiteable, limpia y sanitizada de Hyperion.

Los documentos fuente privados viven en `_private/` y no deben versionarse. R00, R02 y R10 se usan
como referencia local; R03 y los demas R01-R11 quedan fuera del alcance de este loop.

## Arquitectura

- [ADR-0001 - Hyperion como control plane](architecture/ADR-0001-hyperion-control-plane.md)
- [ADR-0002 - CEDCO D02 SIP trunk first](architecture/ADR-0002-cedco-d02-sip-trunk-first.md)
- [ADR-0003 - ElevenLabs como managed voice runtime](architecture/ADR-0003-elevenlabs-managed-voice-runtime.md)
- [ADR-0004 - CallProviderPort y adapters](architecture/ADR-0004-call-provider-port-and-adapters.md)
- [ADR-0005 - PBX inbound fuera de alcance](architecture/ADR-0005-pbx-inbound-out-of-scope.md)
- [ADR-0006 - No smoke-first](architecture/ADR-0006-no-smoke-first.md)
- [ADR-0007 - Limites de datos y habeas data](architecture/ADR-0007-call-data-boundaries-and-habeas-data.md)
- [Agent Platform Domain](architecture/AGENT_PLATFORM_DOMAIN.md)
- [Agent Platform Boundaries](architecture/AGENT_PLATFORM_BOUNDARIES.md)
- [Core Platform Domain](architecture/CORE_PLATFORM_DOMAIN.md)
- [Monorepo structure](architecture/MONOREPO_STRUCTURE.md)
- [Module boundaries](architecture/MODULE_BOUNDARIES.md)
- [Observability Architecture](architecture/OBSERVABILITY_ARCHITECTURE.md)
- [Persistence Architecture](architecture/PERSISTENCE_ARCHITECTURE.md)
- [Prisma Schema Boundaries](architecture/PRISMA_SCHEMA_BOUNDARIES.md)
- [Workers Architecture](architecture/WORKERS_ARCHITECTURE.md)
- [Job Contracts](architecture/JOB_CONTRACTS.md)
- [Mock Call Runtime](architecture/MOCK_CALL_RUNTIME.md)
- [Provider Event Ingestion](architecture/PROVIDER_EVENT_INGESTION.md)
- [Post-Call Event Pipeline](architecture/POST_CALL_EVENT_PIPELINE.md)
- [Operational Dashboard](architecture/OPERATIONAL_DASHBOARD.md)
- [Voice Platform Domain](architecture/VOICE_PLATFORM_DOMAIN.md)
- [Voice Platform Boundaries](architecture/VOICE_PLATFORM_BOUNDARIES.md)
- [Voice Call Lifecycle](architecture/VOICE_CALL_LIFECYCLE.md)
- [Voice Provider Contracts](architecture/VOICE_PROVIDER_CONTRACTS.md)
- [CEDCO D02 Vertical Boundaries](architecture/CEDCO_D02_VERTICAL_BOUNDARIES.md)

## API

- [API Architecture](api/API_ARCHITECTURE.md)
- [API Contracts](api/API_CONTRACTS.md)
- [API Prisma Wiring](api/API_PRISMA_WIRING.md)
- [API DB Integration Tests](api/API_DB_INTEGRATION_TESTS.md)
- [API Observability](api/API_OBSERVABILITY.md)
- [API Policy Gates](api/API_POLICY_GATES.md)
- [API Rate Limits](api/API_RATE_LIMITS.md)
- [API Security Baseline](api/API_SECURITY_BASELINE.md)
- [CEDCO D02 API Contracts](api/CEDCO_D02_API_CONTRACTS.md)
- [CEDCO D02 Mock Runtime API](api/CEDCO_D02_MOCK_RUNTIME_API.md)
- [Mock Provider Event Ingestion API](api/MOCK_PROVIDER_EVENT_INGESTION_API.md)
- [Operational Dashboard API](api/OPERATIONAL_DASHBOARD_API.md)

## Evals

- [CEDCO D02 Eval Suite](evals/CEDCO_D02_EVAL_SUITE.md)
- [CEDCO D02 Eval Scoring](evals/CEDCO_D02_EVAL_SCORING.md)
- [CEDCO D02 Eval Cases](evals/CEDCO_D02_EVAL_CASES.md)
- [CEDCO D02 Eval Results Sample](evals/CEDCO_D02_EVAL_RESULTS_SAMPLE.md)

## Producto

- [CEDCO D02 - Alcance de producto](product/CEDCO_D02_PRODUCT_SCOPE.md)
- [CEDCO D02 - Flujo de lanzamiento outbound](product/CEDCO_D02_CALL_LAUNCH_FLOW.md)
- [CEDCO D02 - Estados de llamada outbound](product/CEDCO_D02_OUTBOUND_CALL_STATES.md)
- [CEDCO D02 - Matriz de proveedores](product/CEDCO_D02_PROVIDER_MATRIX.md)
- [CEDCO D02 - Definition of Done](product/CEDCO_D02_DEFINITION_OF_DONE.md)
- [CEDCO D02 - Domain](product/CEDCO_D02_DOMAIN.md)
- [CEDCO D02 - Intents and flows](product/CEDCO_D02_INTENTS_AND_FLOWS.md)
- [CEDCO D02 - Sites, services and agreements](product/CEDCO_D02_SITE_SERVICE_AGREEMENTS.md)
- [CEDCO D02 - Handoff and compliance](product/CEDCO_D02_HANDOFF_AND_COMPLIANCE.md)
- [CEDCO D02 - Eval scenarios](product/CEDCO_D02_EVAL_SCENARIOS.md)

## Seguridad

- [CEDCO D02 - PII y habeas data](security/CEDCO_D02_PII_AND_HABEAS_DATA.md)
- [CEDCO D02 - Webhook sanitizer](security/CEDCO_D02_WEBHOOK_SANITIZER.md)
- [Agent Platform Security Baseline](security/AGENT_PLATFORM_SECURITY_BASELINE.md)
- [Core Security Baseline](security/CORE_SECURITY_BASELINE.md)
- [Database Security Baseline](security/DATABASE_SECURITY_BASELINE.md)
- [Observability Security Baseline](security/OBSERVABILITY_SECURITY_BASELINE.md)
- [Policy Gates Security Baseline](security/POLICY_GATES_SECURITY_BASELINE.md)
- [Rate Limit Security Baseline](security/RATE_LIMIT_SECURITY_BASELINE.md)
- [Runtime Blockers](security/RUNTIME_BLOCKERS.md)
- [Worker Security Baseline](security/WORKER_SECURITY_BASELINE.md)
- [Mock Runtime Security Baseline](security/MOCK_RUNTIME_SECURITY_BASELINE.md)
- [Provider Event Security Baseline](security/PROVIDER_EVENT_SECURITY_BASELINE.md)
- [Webhook Sanitization Baseline](security/WEBHOOK_SANITIZATION_BASELINE.md)
- [Operational Dashboard Security Baseline](security/OPERATIONAL_DASHBOARD_SECURITY_BASELINE.md)
- [Voice Security Baseline](security/VOICE_SECURITY_BASELINE.md)
- [CEDCO D02 Domain Security Baseline](security/CEDCO_D02_DOMAIN_SECURITY_BASELINE.md)

## Runbooks

- [CEDCO D02 - ElevenLabs SIP connectivity spike](runbooks/CEDCO_D02_ELEVENLABS_SIP_CONNECTIVITY_SPIKE.md)
- [CEDCO D02 - First real call runbook](runbooks/CEDCO_D02_FIRST_REAL_CALL_RUNBOOK.md)
- [CEDCO D02 - Rollback](runbooks/CEDCO_D02_ROLLBACK.md)

## Delivery

- [CEDCO D02 - Roadmap de delivery](delivery/CEDCO_D02_DELIVERY_ROADMAP.md)
- [CI Quality Gates](delivery/CI_QUALITY_GATES.md)
- [DB Integration Tests](delivery/DB_INTEGRATION_TESTS.md)
- [Branch Protection Prep](delivery/BRANCH_PROTECTION_PREP.md)
- [Loop 1 - Monorepo foundation report](delivery/LOOP_1_MONOREPO_FOUNDATION_REPORT.md)
- [Loop 2 - Core Platform Domain report](delivery/LOOP_2_CORE_PLATFORM_DOMAIN_REPORT.md)
- [Loop 3 - Agent Platform Domain report](delivery/LOOP_3_AGENT_PLATFORM_DOMAIN_REPORT.md)
- [Loop 4 - Voice Platform Domain report](delivery/LOOP_4_VOICE_PLATFORM_DOMAIN_REPORT.md)
- [Loop 5 - CEDCO D02 Domain report](delivery/LOOP_5_CEDCO_D02_DOMAIN_REPORT.md)
- [Loop 6 - Persistence report](delivery/LOOP_6_PERSISTENCE_REPORT.md)
- [Loop 7 - CI Quality Gates report](delivery/LOOP_7_CI_QUALITY_GATES_REPORT.md)
- [Loop 8 - DB Integration report](delivery/LOOP_8_DB_INTEGRATION_REPORT.md)
- [Loop 9 - API HTTP Skeleton report](delivery/LOOP_9_API_HTTP_SKELETON_REPORT.md)
- [Loop 10 - API Prisma Wiring report](delivery/LOOP_10_API_PRISMA_WIRING_REPORT.md)
- [Loop 11 - Observability report](delivery/LOOP_11_OBSERVABILITY_REPORT.md)
- [Loop 12 - Policy Gates report](delivery/LOOP_12_POLICY_GATES_REPORT.md)
- [Loop 13 - Workers foundation report](delivery/LOOP_13_WORKERS_FOUNDATION_REPORT.md)
- [Loop 14 - Mock Call Runtime report](delivery/LOOP_14_MOCK_CALL_RUNTIME_REPORT.md)
- [Loop 15 - Provider Event Ingestion report](delivery/LOOP_15_PROVIDER_EVENT_INGESTION_REPORT.md)
- [Loop 16 - CEDCO D02 Eval Suite report](delivery/LOOP_16_CEDCO_D02_EVAL_SUITE_REPORT.md)
- [Loop 17 - Operational Dashboard report](delivery/LOOP_17_OPERATIONAL_DASHBOARD_REPORT.md)
