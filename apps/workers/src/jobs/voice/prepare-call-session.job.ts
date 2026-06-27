import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";
import { createJobSuccess } from "../../core";

export function createPrepareCallSessionJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "voice.call.prepare";
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      return createJobSuccess({
        jobId: job.jobId,
        output: {
          prepared: true,
          dispatch: "not_started",
          provider: "none",
        },
        metadata: { jobType: job.type },
      });
    },
  };
}
