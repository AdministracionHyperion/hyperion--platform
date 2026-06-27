import { sanitizeMetadata } from "../../../../../../packages/shared/src/core";
import type { CedcoD02EvalActualOutcome } from "./eval-actual-outcome";
import type { CedcoD02EvalExpectedOutcome } from "./eval-expected-outcome";

export const cedcoD02EvalFixtureRefs = {
  tenantId: "cedco-test",
  actorId: "actor-test",
  correlationId: "corr-cedco-eval-001",
  siteId: "bucaramanga",
  serviceId: "odontologia-general-test",
  agreementId: "convenio-test",
  safeContactRef: "safe-contact-ref-001",
  patientContextRef: "cedco-context-ref-001",
  consentRef: "cedco-consent-ref-001",
  providerCallRef: "mock_call_cedco_eval_001",
} as const;

export function expectedPass(
  overrides: Partial<CedcoD02EvalExpectedOutcome> = {},
): CedcoD02EvalExpectedOutcome {
  return {
    shouldPass: true,
    expectedNoProviderEgress: true,
    expectedNoRealCall: true,
    expectedNoPii: true,
    forbiddenFields: ["rawTranscript", "audioUrl", "recordingUrl"],
    ...overrides,
  };
}

export function expectedControlledFailure(
  overrides: Partial<CedcoD02EvalExpectedOutcome> = {},
): CedcoD02EvalExpectedOutcome {
  return {
    shouldPass: false,
    expectedNoProviderEgress: true,
    expectedNoRealCall: true,
    expectedNoPii: true,
    ...overrides,
  };
}

export function actualPass(
  overrides: Partial<CedcoD02EvalActualOutcome> = {},
): CedcoD02EvalActualOutcome {
  return {
    passed: true,
    status: "allowed",
    blockingReasons: [],
    handoffRecommended: false,
    safeSummary: "Respuesta administrativa segura para CEDCO D02.",
    returnedFields: ["safeSummary", "correlationId"],
    metrics: ["cedco_d02_eval_case_passed_total"],
    auditEvents: ["cedco.d02.eval.case.pass"],
    policyDenials: [],
    providerEgressDetected: false,
    realCallDetected: false,
    piiDetected: false,
    metadata: sanitizeMetadata({
      tenantId: cedcoD02EvalFixtureRefs.tenantId,
      correlationId: cedcoD02EvalFixtureRefs.correlationId,
    }),
    ...overrides,
  };
}

export function actualControlledFailure(
  errors: readonly string[],
  overrides: Partial<CedcoD02EvalActualOutcome> = {},
): CedcoD02EvalActualOutcome {
  return {
    passed: false,
    status: "blocked",
    blockingReasons: [...errors],
    handoffRecommended: false,
    safeSummary: "Caso bloqueado de forma segura.",
    returnedFields: ["safeSummary", "blockingReasons", "correlationId"],
    metrics: ["cedco_d02_eval_case_blocked_total"],
    auditEvents: ["cedco.d02.eval.case.blocked"],
    policyDenials: [...errors],
    providerEgressDetected: false,
    realCallDetected: false,
    piiDetected: false,
    errors,
    metadata: sanitizeMetadata({
      tenantId: cedcoD02EvalFixtureRefs.tenantId,
      correlationId: cedcoD02EvalFixtureRefs.correlationId,
    }),
    ...overrides,
  };
}
