export type EvalCriterionSeverity = "low" | "medium" | "high" | "critical";

export interface EvalCriterion {
  readonly key: string;
  readonly description: string;
  readonly severity: EvalCriterionSeverity;
}
