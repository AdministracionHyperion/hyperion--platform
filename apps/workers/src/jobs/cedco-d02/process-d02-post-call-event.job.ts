import { processCedcoD02PostCallEvent } from "../../../../../modules/products/cedco/d02-calls/src";
import type { SanitizedProviderEvent } from "../../../../../modules/voice/provider-events/src";
import { createJobError, createJobFailure, createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createProcessD02PostCallEventJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "cedco_d02.post_call_event.process";
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      const event = buildSanitizedEvent(job);
      if (!event) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: "cedco_post_call_payload_blocked",
            message: "CEDCO D02 post-call job requires sanitized provider event",
            retryable: false,
          }),
        });
      }

      const result = processCedcoD02PostCallEvent({ event });
      if (!result.ok) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: result.error.code,
            message: result.error.message,
            retryable: false,
          }),
        });
      }

      return createJobSuccess({
        jobId: job.jobId,
        output: {
          processed: true,
          eventId: result.value.eventId,
          disposition: result.value.disposition,
          safeSummary: result.value.safeSummary,
        },
        metadata: { jobType: job.type },
      });
    },
  };
}

function buildSanitizedEvent(job: JobEnvelope): SanitizedProviderEvent | undefined {
  if (
    typeof job.payload.eventId !== "string" ||
    typeof job.payload.type !== "string" ||
    typeof job.payload.providerCallRef !== "string" ||
    !job.payload.providerCallRef.startsWith("mock_call_")
  ) {
    return undefined;
  }

  return {
    eventId: job.payload.eventId as SanitizedProviderEvent["eventId"],
    source: "mock",
    type: job.payload.type as SanitizedProviderEvent["type"],
    tenantId: job.tenantId,
    correlationId: job.correlationId,
    providerCallRef: job.payload.providerCallRef,
    safeCallSessionRef:
      typeof job.payload.safeCallSessionRef === "string"
        ? job.payload.safeCallSessionRef
        : job.payload.providerCallRef,
    normalizedStatus: "post_call_available",
    safeOutcome: typeof job.payload.safeOutcome === "string" ? job.payload.safeOutcome : undefined,
    safeSummary: typeof job.payload.safeSummary === "string" ? job.payload.safeSummary : undefined,
    safeIntent: typeof job.payload.safeIntent === "string" ? job.payload.safeIntent : undefined,
    handoffRecommended: job.payload.handoffRecommended === true,
    postCallAvailable: true,
    metadata: job.payload,
  };
}
