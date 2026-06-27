import {
  actualControlledFailure,
  actualPass,
  expectedControlledFailure,
  expectedPass,
} from "../eval-fixtures";
import { defineCedcoD02EvalCase, type CedcoD02EvalCase } from "../eval-runner";

export const cedcoD02SchedulingScenarios: readonly CedcoD02EvalCase[] = [
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.scheduling.21",
    type: "scheduling",
    severity: "info",
    name: "conceptual availability guidance is allowed",
    expected: expectedPass({ expectedStatus: "allowed" }),
    actual: actualPass({ safeSummary: "Orientación conceptual de agendamiento mock." }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.scheduling.22",
    type: "scheduling",
    severity: "critical",
    name: "real calendar integration is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["calendar_integration_blocked"],
      expectedPolicyDenials: ["calendar_integration_blocked"],
    }),
    actual: actualControlledFailure(["calendar_integration_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.scheduling.23",
    type: "scheduling",
    severity: "critical",
    name: "integration mode without gate is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["scheduling_integration_blocked"],
      expectedPolicyDenials: ["scheduling_integration_blocked"],
    }),
    actual: actualControlledFailure(["scheduling_integration_blocked"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.scheduling.24",
    type: "scheduling",
    severity: "info",
    name: "safe scheduling guidance remains mock only",
    expected: expectedPass({ expectedSafeSummaryContains: ["mock"] }),
    actual: actualPass({ safeSummary: "Solicitud mock orientada sin confirmar cita real." }),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.scheduling.25",
    type: "scheduling",
    severity: "warning",
    name: "invalid date is blocked in a controlled way",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["invalid_date"],
      expectedPolicyDenials: ["invalid_date"],
    }),
    actual: actualControlledFailure(["invalid_date"]),
  }),
  defineCedcoD02EvalCase({
    caseId: "cedco-d02.scheduling.26",
    type: "unsafe_payload",
    severity: "critical",
    name: "sensitive scheduling metadata is blocked",
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: ["unsafe_metadata_blocked"],
      expectedPolicyDenials: ["unsafe_metadata_blocked"],
    }),
    actual: actualControlledFailure(["unsafe_metadata_blocked"]),
  }),
];
