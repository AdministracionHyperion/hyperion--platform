import { createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createEvaluateReadinessJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "cedco_d02.readiness.evaluate";
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      const blockingReasons = readinessBlockingReasons(job.payload);
      return createJobSuccess({
        jobId: job.jobId,
        output: {
          ready: blockingReasons.length === 0,
          blockingReasons,
          productionReady: false,
          nextStep:
            blockingReasons.length > 0
              ? "resolve_worker_readiness_blockers"
              : "continue_with_non_runtime_checks",
        },
        metadata: { jobType: job.type },
      });
    },
  };
}

function readinessBlockingReasons(payload: Readonly<Record<string, unknown>>): readonly string[] {
  const reasons = new Set<string>(["real_calls_disabled"]);
  const configuration = readObject(payload.configuration);
  if (!configuration || !configuration.activeAgentVersionId) {
    reasons.add("missing_agent_version");
  }
  if (!configuration || !configuration.activeKnowledgeBaseVersionId) {
    reasons.add("missing_knowledge_base_version");
  }
  return [...reasons];
}

function readObject(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}
