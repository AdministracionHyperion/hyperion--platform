import {
  processSanitizedProviderEvent,
  type SanitizedProviderEvent,
} from "../../../../../modules/voice/provider-events/src";
import { createJobError, createJobFailure, createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createProcessSanitizedProviderEventJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "voice.provider_event.sanitized.process";
    },

    async handle(job: JobEnvelope, context: WorkerContext): Promise<JobResult> {
      const event = buildSanitizedEvent(job);
      if (!event) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: "provider_event_payload_blocked",
            message: "sanitized provider event job requires safe mock payload",
            retryable: false,
          }),
        });
      }

      const processed = processSanitizedProviderEvent({
        event,
        logger: context.logger,
        metrics: context.metrics,
      });
      if (!processed.ok) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: processed.error.code,
            message: processed.error.message,
            retryable: false,
          }),
        });
      }

      return createJobSuccess({
        jobId: job.jobId,
        output: {
          processed: true,
          eventId: processed.value.eventId,
          status: processed.value.status,
          safeSummary: processed.value.safeSummary,
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
    normalizedStatus:
      typeof job.payload.normalizedStatus === "string"
        ? (job.payload.normalizedStatus as SanitizedProviderEvent["normalizedStatus"])
        : "completed",
    safeOutcome: typeof job.payload.safeOutcome === "string" ? job.payload.safeOutcome : undefined,
    safeSummary: typeof job.payload.safeSummary === "string" ? job.payload.safeSummary : undefined,
    safeIntent: typeof job.payload.safeIntent === "string" ? job.payload.safeIntent : undefined,
    handoffRecommended: job.payload.handoffRecommended === true,
    postCallAvailable: job.payload.postCallAvailable === true,
    metadata: job.payload,
  };
}
