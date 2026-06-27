import { defineCedcoD02EvalCase, type CedcoD02EvalCase } from "../eval-runner";
import {
  actualControlledFailure,
  actualPass,
  expectedControlledFailure,
  expectedPass,
} from "../eval-fixtures";

export const cedcoD02ReadinessScenarios: readonly CedcoD02EvalCase[] = [
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.1",
    type: "readiness",
    severity: "info",
    name: "valid mock readiness with consent and safe contact reference",
    expected: expectedPass({ expectedStatus: "ready" }),
    actual: actualPass({ status: "ready" }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.2",
    type: "readiness",
    severity: "high",
    name: "missing consent reference blocks readiness",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["missing_consent_ref"],
      expectedPolicyDenials: ["missing_consent_ref"],
    }),
    actual: actualControlledFailure(["missing_consent_ref"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.3",
    type: "readiness",
    severity: "high",
    name: "missing safe contact reference blocks readiness",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["missing_safe_contact_ref"],
      expectedPolicyDenials: ["missing_safe_contact_ref"],
    }),
    actual: actualControlledFailure(["missing_safe_contact_ref"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.4",
    type: "readiness",
    severity: "critical",
    name: "missing tenant blocks readiness",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["missing_tenant"],
      expectedPolicyDenials: ["missing_tenant"],
    }),
    actual: actualControlledFailure(["missing_tenant"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.5",
    type: "readiness",
    severity: "critical",
    name: "missing correlation blocks readiness",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["missing_correlation"],
      expectedPolicyDenials: ["missing_correlation"],
    }),
    actual: actualControlledFailure(["missing_correlation"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.6",
    type: "readiness",
    severity: "info",
    name: "mock runtime mode is allowed",
    expected: expectedPass({ expectedStatus: "ready" }),
    actual: actualPass({ status: "ready", safeSummary: "runtime mock permitido para evaluación." }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.7",
    type: "readiness",
    severity: "critical",
    name: "non-mock runtime mode is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["non_mock_runtime_blocked"],
      expectedPolicyDenials: ["non_mock_runtime_blocked"],
    }),
    actual: actualControlledFailure(["non_mock_runtime_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.8",
    type: "readiness",
    severity: "critical",
    name: "real call enablement is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["real_call_enablement_blocked"],
      expectedPolicyDenials: ["real_call_enablement_blocked"],
    }),
    actual: actualControlledFailure(["real_call_enablement_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.9",
    type: "readiness",
    severity: "critical",
    name: "provider egress enablement is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["provider_path_blocked"],
      expectedPolicyDenials: ["provider_path_blocked"],
    }),
    actual: actualControlledFailure(["provider_path_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.readiness.10",
    type: "readiness",
    severity: "critical",
    name: "metadata with contact data is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["unsafe_metadata_blocked"],
      expectedPolicyDenials: ["unsafe_metadata_blocked"],
    }),
    actual: actualControlledFailure(["unsafe_metadata_blocked"]),
  }),
];
