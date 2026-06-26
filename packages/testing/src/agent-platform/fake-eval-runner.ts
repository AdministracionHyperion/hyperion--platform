import { createCorrelationId } from "../../../shared/src/core";
import type {
  EvalResult,
  EvalResultId,
} from "../../../../modules/agent-platform/evals/src/eval-result";
import type { EvalRun } from "../../../../modules/agent-platform/evals/src/eval-run";
import type { EvalRunnerPort } from "../../../../modules/agent-platform/evals/src/eval-runner.port";
import type { EvalScenario } from "../../../../modules/agent-platform/evals/src/eval-scenario";

export class FakeEvalRunner implements EvalRunnerPort {
  async runScenario(run: EvalRun, scenario: EvalScenario): Promise<EvalResult> {
    return {
      evalResultId: createEvalResultId(),
      tenantId: run.tenantId,
      evalRunId: run.evalRunId,
      evalScenarioId: scenario.evalScenarioId,
      status: "passed",
      score: 1,
      findings: [],
      metadata: {},
      occurredAt: run.startedAt,
    };
  }
}

function createEvalResultId(): EvalResultId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `eval-result-${correlationId.value}` : `eval-result-${Date.now()}`
  ) as EvalResultId;
}
