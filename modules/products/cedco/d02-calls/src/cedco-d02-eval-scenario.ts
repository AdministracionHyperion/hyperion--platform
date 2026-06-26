import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoCallIntent } from "./cedco-call-intent";
import type { CedcoCallObjective } from "./cedco-call-objective";

export type CedcoD02EvalSeverity = "low" | "medium" | "high" | "critical";

export interface CedcoD02EvalScenario {
  readonly evalScenarioId: string;
  readonly tenantId: string;
  readonly intent: CedcoCallIntent;
  readonly objective: CedcoCallObjective;
  readonly input: string;
  readonly expectedBehavior: string;
  readonly forbiddenBehavior: string;
  readonly severity: CedcoD02EvalSeverity;
  readonly metadata: SafeMetadata;
}
