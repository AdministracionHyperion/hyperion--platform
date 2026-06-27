import type { WorkerServices } from "../../composition";
import { createJobError, createJobFailure, createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createFinalizeMockCallSessionJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "voice.call.mock_session.finalize";
    },

    async handle(job: JobEnvelope, context: WorkerContext): Promise<JobResult> {
      const services = context.services as WorkerServices;
      const sessionId =
        typeof job.payload.sessionId === "string"
          ? job.payload.sessionId
          : `mock-session-${job.correlationId}`;
      const finalized = await services.mockCallRuntime.finalizeSession(sessionId);
      if (!finalized.ok) {
        return createJobFailure({
          jobId: job.jobId,
          error: createJobError({
            code: finalized.error.code,
            message: finalized.error.message,
            retryable: false,
          }),
        });
      }

      return createJobSuccess({
        jobId: job.jobId,
        output: {
          sessionId: finalized.value.session.sessionId,
          status: finalized.value.session.status,
          safeSummary: finalized.value.postCallResult.safeSummary,
        },
        metadata: { jobType: job.type },
      });
    },
  };
}
