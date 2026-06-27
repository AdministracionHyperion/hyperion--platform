import { sanitizeMetadata } from "../../../../../packages/shared/src/core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";
import { createJobSuccess } from "../../core";

export function createProcessCallEventJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "voice.call.event.process";
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      return createJobSuccess({
        jobId: job.jobId,
        output: {
          processed: true,
          metadata: sanitizeMetadata(job.payload),
        },
        metadata: { jobType: job.type },
      });
    },
  };
}
