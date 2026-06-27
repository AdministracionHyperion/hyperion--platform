import { sanitizeMetadata } from "../../../../../packages/shared/src/core";
import { createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";
import type { WorkerServices } from "../../composition";

export function createRecordMetricJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "cedco_d02.metric.record";
    },

    async handle(job: JobEnvelope, context: WorkerContext): Promise<JobResult> {
      const services = context.services as WorkerServices;
      const metric = {
        metricId: `metric-${job.jobId}`,
        tenantId: job.tenantId,
        key: String(job.payload.key ?? "cedco_d02.worker_metric"),
        value: Number(job.payload.value ?? 1),
        dimensions: sanitizeMetadata(readDimensions(job.payload.dimensions)),
        occurredAt: context.now(),
      };
      await services.cedcoD02Metrics.record(metric);

      return createJobSuccess({
        jobId: job.jobId,
        output: {
          recorded: true,
          metricId: metric.metricId,
        },
        metadata: { jobType: job.type, dimensions: metric.dimensions },
      });
    },
  };
}

function readDimensions(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : {};
}
