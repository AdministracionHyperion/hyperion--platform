import { metricNames } from "./metrics";
import type { LoggerPort } from "./logger.port";
import type { MetricsRegistryPort } from "./metric-types";
import type { ObservabilityContext } from "./observability-context";
import { sanitizeLogMetadata } from "./redaction";

export interface RequestObservabilityInput extends ObservabilityContext {
  readonly statusCode: number;
  readonly durationMs: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function recordObservedRequest(
  logger: LoggerPort,
  metrics: MetricsRegistryPort,
  input: RequestObservabilityInput,
): void {
  const route = input.route ?? "unknown";
  const method = input.method ?? "UNKNOWN";
  const labels = {
    method,
    route,
    status: String(input.statusCode),
  };

  metrics.increment(metricNames.httpRequestsTotal, labels);
  metrics.observe(metricNames.httpRequestDurationMs, input.durationMs, { method, route });

  if (input.statusCode >= 400) {
    metrics.increment(metricNames.httpRequestErrorsTotal, labels);
  }

  logger.info({
    message: "api.request.completed",
    eventName: "api.request.completed",
    correlationId: input.correlationId,
    tenantId: input.tenantId,
    actorId: input.actorId,
    route,
    method,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    metadata: sanitizeLogMetadata(input.metadata),
  });
}
