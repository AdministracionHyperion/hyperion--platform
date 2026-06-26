import type { EvalResult } from "./eval-result";
import type { EvalRun, EvalRunId } from "./eval-run";

export interface EvalRunRepositoryPort {
  saveRun(run: EvalRun): Promise<void>;
  findRun(tenantId: string, evalRunId: EvalRunId): Promise<EvalRun | null>;
  saveResult(result: EvalResult): Promise<void>;
  findResultsByRun(tenantId: string, evalRunId: EvalRunId): Promise<readonly EvalResult[]>;
}
