import { metricNames, type MetricsRegistryPort } from "../../../../packages/observability/src";

export function recordStatusMetrics(
  metrics: MetricsRegistryPort,
  input: {
    readonly method: string;
    readonly route: string;
    readonly statusCode: number;
    readonly durationMs: number;
  },
): void {
  const labels = {
    method: input.method,
    route: input.route,
    status: String(input.statusCode),
  };

  metrics.increment(metricNames.httpRequestsTotal, labels);
  metrics.observe(metricNames.httpRequestDurationMs, input.durationMs, {
    method: input.method,
    route: input.route,
  });

  if (input.statusCode >= 400) {
    metrics.increment(metricNames.httpRequestErrorsTotal, labels);
  }

  if (input.statusCode === 400) {
    metrics.increment(metricNames.validationErrorsTotal, { route: input.route });
  }

  if (input.statusCode === 403) {
    metrics.increment(metricNames.forbiddenRequestsTotal, { route: input.route });
  }

  if (input.route.includes("/products/cedco/d02")) {
    metrics.increment(metricNames.cedcoD02RequestsTotal, { route: input.route });
  }

  if (input.route.includes("/voice/calls")) {
    metrics.increment(metricNames.voiceCallContractRequestsTotal, { route: input.route });
  }
}
