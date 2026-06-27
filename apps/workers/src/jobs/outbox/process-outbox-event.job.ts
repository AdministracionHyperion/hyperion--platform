import { sanitizeMetadata } from "../../../../../packages/shared/src/core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";
import { createJobSuccess } from "../../core";
import { outboxJobTypes } from "./outbox-job-types";

export function createProcessOutboxEventJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === outboxJobTypes[0];
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      return createJobSuccess({
        jobId: job.jobId,
        output: {
          processed: true,
          externalPublish: "not-configured",
          payload: sanitizeMetadata(job.payload),
        },
        metadata: { jobType: job.type },
      });
    },
  };
}
