import type { Brand } from "../../../../packages/shared/src/core";
import type { EvalRunStatus } from "./eval-status";

export type EvalRunId = Brand<string, "EvalRunId">;

export interface EvalRun {
  readonly evalRunId: EvalRunId;
  readonly tenantId: string;
  readonly agentVersionId?: string;
  readonly status: EvalRunStatus;
  readonly startedBy: string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}
