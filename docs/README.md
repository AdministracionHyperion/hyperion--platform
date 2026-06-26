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

## Producto

- [CEDCO D02 - Alcance de producto](product/CEDCO_D02_PRODUCT_SCOPE.md)
- [CEDCO D02 - Flujo de lanzamiento outbound](product/CEDCO_D02_CALL_LAUNCH_FLOW.md)
- [CEDCO D02 - Estados de llamada outbound](product/CEDCO_D02_OUTBOUND_CALL_STATES.md)
- [CEDCO D02 - Matriz de proveedores](product/CEDCO_D02_PROVIDER_MATRIX.md)
- [CEDCO D02 - Definition of Done](product/CEDCO_D02_DEFINITION_OF_DONE.md)

## Seguridad

- [CEDCO D02 - PII y habeas data](security/CEDCO_D02_PII_AND_HABEAS_DATA.md)
- [CEDCO D02 - Webhook sanitizer](security/CEDCO_D02_WEBHOOK_SANITIZER.md)
- [Agent Platform Security Baseline](security/AGENT_PLATFORM_SECURITY_BASELINE.md)
- [Core Security Baseline](security/CORE_SECURITY_BASELINE.md)

## Runbooks

- [CEDCO D02 - ElevenLabs SIP connectivity spike](runbooks/CEDCO_D02_ELEVENLABS_SIP_CONNECTIVITY_SPIKE.md)
- [CEDCO D02 - First real call runbook](runbooks/CEDCO_D02_FIRST_REAL_CALL_RUNBOOK.md)
- [CEDCO D02 - Rollback](runbooks/CEDCO_D02_ROLLBACK.md)

## Delivery

- [CEDCO D02 - Roadmap de delivery](delivery/CEDCO_D02_DELIVERY_ROADMAP.md)
- [Loop 1 - Monorepo foundation report](delivery/LOOP_1_MONOREPO_FOUNDATION_REPORT.md)
- [Loop 2 - Core Platform Domain report](delivery/LOOP_2_CORE_PLATFORM_DOMAIN_REPORT.md)
- [Loop 3 - Agent Platform Domain report](delivery/LOOP_3_AGENT_PLATFORM_DOMAIN_REPORT.md)
