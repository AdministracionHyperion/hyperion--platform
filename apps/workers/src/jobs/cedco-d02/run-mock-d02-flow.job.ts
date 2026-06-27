import { runCedcoD02MockCallFlow } from "../../../../../modules/products/cedco/d02-calls/src";
import type { WorkerServices } from "../../composition";
import { createJobError, createJobFailure, createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createRunMockD02FlowJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "cedco_d02.mock_flow.run";
    },

    async handle(job: JobEnvelope, context: WorkerContext): Promise<JobResult> {
      const services = context.services as WorkerServices;
      const flow = await runCedcoD02MockCallFlow({
        intent: {
          tenantId: job.tenantId,
          actorId: job.actorId ?? "worker-system",
          correlationId: job.correlationId,
          cedcoSiteId: String(job.payload.cedcoSiteId ?? "bucaramanga"),
          serviceId: String(job.payload.serviceId ?? "odontologia-general-test"),
          agreementId:
            typeof job.payload.agreementId === "string" ? job.payload.agreementId : undefined,
          safeContactRef: String(job.payload.safeContactRef ?? "safe-contact-ref-001"),
          patientContextRef: String(job.payload.patientContextRef ?? "cedco-context-ref-001"),
          consentRef: String(job.payload.consentRef ?? "cedco-consent-ref-001"),
          callPurpose: "orientation",
          objective: "orientation",
          scriptId: typeof job.payload.scriptId === "string" ? job.payload.scriptId : undefined,
          metadata: job.payload,
        },
        runtime: services.mockCallRuntime,
        logger: context.logger,
        metrics: context.metrics,
      });

      if (!flow.ok) {
        return createJobFailure({
          jobId: job.jobId,
          status: "blocked",
          error: createJobError({
            code: flow.error.code,
            message: flow.error.message,
            retryable: false,
          }),
        });
      }

      return createJobSuccess({
        jobId: job.jobId,
        output: {
          flowId: flow.value.flowId,
          sessionId: flow.value.session.sessionId,
          status: flow.value.status,
          providerCallRef: flow.value.providerCallRef,
          eventsCount: flow.value.events.length,
          safeSummary: flow.value.safeSummary,
        },
        metadata: { jobType: job.type },
      });
    },
  };
}
