import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  startTimer,
} from "../../../../packages/observability/src";
import { createLocalCorrelationId, getHeaderValue } from "../http/request-context";
import type { ApiServices } from "../services";
import { recordRequestAudit } from "./audit-hook";
import { recordRequestMetrics } from "./metrics-hook";
import { logCompletedRequest } from "./request-logging-hook";

const requestTimers = new WeakMap<FastifyRequest, ReturnType<typeof startTimer>>();

export async function registerApiObservabilityPlugin(
  app: FastifyInstance,
  services: ApiServices,
): Promise<void> {
  const observability = services.observability ?? {
    logger: new InMemoryLogger(),
    metrics: new InMemoryMetricsRegistry(),
  };

  app.addHook("onRequest", async (request) => {
    if (!getHeaderValue(request, "x-correlation-id")) {
      request.headers["x-correlation-id"] = createLocalCorrelationId();
    }
    requestTimers.set(request, startTimer());
  });

  app.addHook("onResponse", async (request, reply) => {
    const route = resolveRoute(request);
    const durationMs = requestTimers.get(request)?.elapsedMs() ?? 0;
    const statusCode = reply.statusCode;

    logCompletedRequest(observability.logger, request, { route, statusCode, durationMs });
    recordRequestMetrics(observability.metrics, request, { route, statusCode, durationMs });
    await recordRequestAudit(observability, request, { route, statusCode });
  });
}

export function resolveRoute(request: FastifyRequest): string {
  return request.routeOptions.url ?? request.url.split("?")[0] ?? "unknown";
}
