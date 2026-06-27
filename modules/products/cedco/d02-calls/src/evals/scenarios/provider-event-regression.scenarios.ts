import {
  actualControlledFailure,
  actualPass,
  expectedControlledFailure,
  expectedPass,
} from "../eval-fixtures";
import { defineCedcoD02EvalCase, type CedcoD02EvalCase } from "../eval-runner";

export const cedcoD02ProviderEventRegressionScenarios: readonly CedcoD02EvalCase[] = [
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.69",
    type: "provider_event_regression",
    severity: "critical",
    name: "mock provider event with valid signature passes",
    expected: expectedPass({
      expectedStatus: "processed",
      expectedMetrics: ["provider_events_processed_total"],
      expectedAuditEvents: ["provider.event.processed"],
    }),
    actual: actualPass({
      status: "processed",
      metrics: ["provider_events_processed_total"],
      auditEvents: ["provider.event.processed"],
    }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.70",
    type: "provider_event_regression",
    severity: "critical",
    name: "replay is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["replay_blocked"],
      expectedPolicyDenials: ["replay_blocked"],
    }),
    actual: actualControlledFailure(["replay_blocked"], {
      metrics: ["provider_events_replay_blocked_total"],
      auditEvents: ["provider.event.replay_blocked"],
    }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.71",
    type: "provider_event_regression",
    severity: "critical",
    name: "invalid signature is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["signature_invalid"],
      expectedPolicyDenials: ["signature_invalid"],
    }),
    actual: actualControlledFailure(["signature_invalid"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.72",
    type: "provider_event_regression",
    severity: "critical",
    name: "future real provider source is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["non_mock_source_blocked"],
      expectedPolicyDenials: ["non_mock_source_blocked"],
    }),
    actual: actualControlledFailure(["non_mock_source_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.73",
    type: "provider_event_regression",
    severity: "critical",
    name: "provider call reference without mock prefix is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["provider_ref_prefix_blocked"],
      expectedPolicyDenials: ["provider_ref_prefix_blocked"],
    }),
    actual: actualControlledFailure(["provider_ref_prefix_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.74",
    type: "provider_event_regression",
    severity: "critical",
    name: "sanitized event excludes raw payload",
    expected: expectedPass({ forbiddenFields: ["rawProviderPayload"] }),
    actual: actualPass({ returnedFields: ["eventId", "safeSummary", "safeIntent"] }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.provider-event-regression.75",
    type: "provider_event_regression",
    severity: "high",
    name: "CEDCO post-call event produces safe outcome",
    expected: expectedPass({ expectedSafeSummaryContains: ["seguro"] }),
    actual: actualPass({ safeSummary: "Outcome seguro de post-call CEDCO D02." }),
  }),
];
