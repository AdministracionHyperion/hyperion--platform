import type { CallRuntimeCommand } from "../../../../../modules/voice/call-runtime/src";
import type { WorkerServices } from "../../composition";
import { createJobError, createJobFailure, createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createRunMockCallSessionJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "voice.call.mock_session.run";
    },

    async handle(job: JobEnvelope, context: WorkerContext): Promise<JobResult> {
      const services = context.services as WorkerServices;
      const started = await services.mockCallRuntime.startSession(commandFromJob(job));
      if (!started.ok) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: started.error.code,
            message: started.error.message,
            retryable: false,
          }),
        });
      }

      for (const event of started.value.events) {
        const processed = await services.mockCallRuntime.processEvent(event);
        if (!processed.ok) {
          return createJobFailure({
            jobId: job.jobId,
            error: createJobError({
              code: processed.error.code,
              message: processed.error.message,
              retryable: false,
            }),
          });
        }
      }

      return createJobSuccess({
        jobId: job.jobId,
        output: {
          sessionId: started.value.session.sessionId,
          status: "running",
          providerCallRef: started.value.session.providerCallRef,
          eventsCount: started.value.events.length,
        },
        metadata: { jobType: job.type },
      });
    },
  };
}

function commandFromJob(job: JobEnvelope): CallRuntimeCommand {
  return {
    tenantId: job.tenantId,
    actorId: job.actorId ?? "worker-system",
    correlationId: job.correlationId,
    callIntentId: String(job.payload.callIntentId ?? `intent-${job.jobId}`),
    productCode: "cedco-d02",
    runtimeMode: "mock",
    scriptId: String(job.payload.scriptId ?? "cedco-d02-default-mock"),
    safeContactRef: String(job.payload.safeContactRef ?? "safe-contact-ref-001"),
    patientContextRef: String(job.payload.patientContextRef ?? "cedco-context-ref-001"),
    consentRef: String(job.payload.consentRef ?? "cedco-consent-ref-001"),
    metadata: job.payload,
  };
}
