import type { FastifyRequest } from "fastify";
import type { MetricsRegistryPort } from "../../../../packages/observability/src";
import { recordStatusMetrics } from "./api-metrics";

export function recordRequestMetrics(
  metrics: MetricsRegistryPort,
  request: FastifyRequest,
  input: {
    readonly route: string;
    readonly statusCode: number;
    readonly durationMs: number;
  },
): void {
  recordStatusMetrics(metrics, {
    method: request.method,
    route: input.route,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
  });
}
