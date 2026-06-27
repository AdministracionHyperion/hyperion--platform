import {
  createCorrelationId,
  ok,
  sanitizeMetadata,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { FeedbackRepositoryPort } from "../../../../../core/feedback/src/feedback-repository.port";
import { recordFeedbackEvent } from "../../../../../core/feedback/src/use-cases/record-feedback-event";
import type { CedcoD02Metric } from "../cedco-d02-metric";
import type { CedcoD02MetricsPort } from "../cedco-d02-metrics.port";

export interface RecordCedcoD02MetricInput {
  readonly context: OperationContext;
  readonly metricsPort: CedcoD02MetricsPort;
  readonly key: string;
  readonly value: number;
  readonly dimensions?: Readonly<Record<string, unknown>>;
  readonly feedbackRepository?: FeedbackRepositoryPort;
  readonly policyViolation?: boolean;
}

export async function recordCedcoD02Metric(
  input: RecordCedcoD02MetricInput,
): Promise<Result<CedcoD02Metric, never>> {
  const metric: CedcoD02Metric = {
    metricId: createLocalId("cedco-d02-metric"),
    tenantId: input.context.tenantId,
    key: input.key,
    value: input.value,
    dimensions: sanitizeMetadata(input.dimensions),
    occurredAt: input.context.occurredAt,
  };

  await input.metricsPort.record(metric);

  if (input.policyViolation && input.feedbackRepository) {
    await recordFeedbackEvent({
      context: input.context,
      repository: input.feedbackRepository,
      source: "system",
      resourceType: "cedco_d02_metric",
      resourceId: metric.metricId,
      outcome: "policy_violation",
      metadata: metric.dimensions,
    });
  }

  return ok(metric);
}

function createLocalId(prefix: string): string {
  const correlationId = createCorrelationId();
  return correlationId.ok ? `${prefix}-${correlationId.value}` : `${prefix}-${Date.now()}`;
}
