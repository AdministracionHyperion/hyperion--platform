import type { CallRuntimeCommand } from "../../../../modules/voice/call-runtime/src";

export const mockCallRuntimeCommandFixture: CallRuntimeCommand = {
  tenantId: "cedco-test",
  actorId: "actor-test",
  correlationId: "corr-runtime-fixture-001",
  callIntentId: "cedco-d02-intent-fixture",
  productCode: "cedco-d02",
  runtimeMode: "mock",
  scriptId: "cedco-d02-default-mock",
  safeContactRef: "safe-contact-ref-001",
  patientContextRef: "cedco-context-ref-001",
  consentRef: "cedco-consent-ref-001",
  metadata: {},
};
