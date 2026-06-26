import type { EvalResult } from "../../../../modules/agent-platform/evals/src/eval-result";
import type { EvalRun, EvalRunId } from "../../../../modules/agent-platform/evals/src/eval-run";
import type { EvalRunRepositoryPort } from "../../../../modules/agent-platform/evals/src/eval-run-repository.port";

export class InMemoryEvalRunRepository implements EvalRunRepositoryPort {
  private readonly runs = new Map<string, EvalRun>();
  private readonly results: EvalResult[] = [];

  async saveRun(run: EvalRun): Promise<void> {
    this.runs.set(key(run.tenantId, run.evalRunId), run);
  }

  async findRun(tenantId: string, evalRunId: EvalRunId): Promise<EvalRun | null> {
    return this.runs.get(key(tenantId, evalRunId)) ?? null;
  }

  async saveResult(result: EvalResult): Promise<void> {
    this.results.push(result);
  }

  async findResultsByRun(tenantId: string, evalRunId: EvalRunId): Promise<readonly EvalResult[]> {
    return this.results.filter(
      (result) => result.tenantId === tenantId && result.evalRunId === evalRunId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
