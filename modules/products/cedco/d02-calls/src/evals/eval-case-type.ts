export const cedcoD02EvalCaseTypes = [
  "readiness",
  "compliance",
  "scheduling",
  "eligibility",
  "orientation",
  "handoff",
  "unsafe_payload",
  "clinical_boundary",
  "mock_runtime_regression",
  "provider_event_regression",
] as const;

export type CedcoD02EvalCaseType = (typeof cedcoD02EvalCaseTypes)[number];
