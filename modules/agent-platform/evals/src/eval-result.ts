import type { Brand, SafeMetadata } from "../../../../packages/shared/src/core";
import type { EvalRunId } from "./eval-run";
import type { EvalScenarioId } from "./eval-scenario-id";
import type { EvalResultStatus } from "./eval-status";

export type EvalResultId = Brand<string, "EvalResultId">;

export interface EvalFinding {
  readonly key: string;
  readonly message: string;
  readonly policyViolation?: boolean;
}

export interface EvalResult {
  readonly evalResultId: EvalResultId;
  readonly tenantId: string;
  readonly evalRunId: EvalRunId;
  readonly evalScenarioId: EvalScenarioId;
  readonly status: EvalResultStatus;
  readonly score: number;
  readonly findings: readonly EvalFinding[];
  readonly metadata: SafeMetadata;
  readonly occurredAt: Date;
}
