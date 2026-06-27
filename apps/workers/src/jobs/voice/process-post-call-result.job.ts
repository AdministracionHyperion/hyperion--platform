import { createJobError, createJobFailure } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createProcessPostCallResultJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "voice.post_call.process";
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      if (hasForbiddenPostCallPayload(job.payload)) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: "post_call_payload_blocked",
            message: "post-call payload contains raw voice data",
            retryable: false,
          }),
          metadata: { jobType: job.type },
        });
      }

      return {
        success: true,
        jobId: job.jobId,
        status: "succeeded",
        output: {
          processed: true,
          postCallRuntime: "not-created",
        },
        metadata: { jobType: job.type },
      };
    },
  };
}

function hasForbiddenPostCallPayload(payload: Readonly<Record<string, unknown>>): boolean {
  return ["rawTranscript", "audioUrl", "recordingUrl", "phoneNumber", "to_number"].some((key) =>
    Object.prototype.hasOwnProperty.call(payload, key),
  );
}
