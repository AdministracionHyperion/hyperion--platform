import {
  actualControlledFailure,
  actualPass,
  expectedControlledFailure,
  expectedPass,
} from "../eval-fixtures";
import { defineCedcoD02EvalCase, type CedcoD02EvalCase } from "../eval-runner";

export const cedcoD02MockRuntimeRegressionScenarios: readonly CedcoD02EvalCase[] = [
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.63",
    type: "mock_runtime_regression",
    severity: "critical",
    name: "full mock call flow completes",
    expected: expectedPass({
      expectedStatus: "completed",
      expectedMetrics: ["mock_call_flows_completed_total"],
      expectedAuditEvents: ["cedco.d02.mock_flow.completed"],
    }),
    actual: actualPass({
      status: "completed",
      safeSummary: "Flujo mock completado sin llamada real.",
      metrics: ["mock_call_flows_completed_total"],
      auditEvents: ["cedco.d02.mock_flow.completed"],
    }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.64",
    type: "mock_runtime_regression",
    severity: "critical",
    name: "mock call runtime does not use provider",
    expected: expectedPass({ expectedNoProviderEgress: true }),
    actual: actualPass({ providerEgressDetected: false }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.65",
    type: "mock_runtime_regression",
    severity: "info",
    name: "mock provider reference has mock prefix",
    expected: expectedPass({ expectedSafeSummaryContains: ["mock_call_"] }),
    actual: actualPass({ safeSummary: "providerCallRef mock_call_cedco_eval_001" }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.66",
    type: "mock_runtime_regression",
    severity: "critical",
    name: "mock events contain no sensitive data",
    expected: expectedPass({ forbiddenFields: ["unsafeContact", "clinicalRecord"] }),
    actual: actualPass({ returnedFields: ["eventId", "type", "safeSummary", "correlationId"] }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.67",
    type: "mock_runtime_regression",
    severity: "critical",
    name: "post-call result contains no raw media",
    expected: expectedPass({ forbiddenFields: ["rawMedia", "recordingLink"] }),
    actual: actualPass({ returnedFields: ["safeSummary", "disposition", "handoffRecommended"] }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.68",
    type: "mock_runtime_regression",
    severity: "high",
    name: "audit and metrics are present",
    expected: expectedPass({
      expectedMetrics: ["mock_call_flows_completed_total"],
      expectedAuditEvents: ["cedco.d02.mock_flow.completed"],
    }),
    actual: actualPass({
      metrics: ["mock_call_flows_completed_total"],
      auditEvents: ["cedco.d02.mock_flow.completed"],
    }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.mock-runtime-regression.76",
    type: "mock_runtime_regression",
    severity: "critical",
    name: "non-mock runtime payload remains blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["non_mock_runtime_blocked"],
      expectedPolicyDenials: ["non_mock_runtime_blocked"],
    }),
    actual: actualControlledFailure(["non_mock_runtime_blocked"]),
  }),
];
