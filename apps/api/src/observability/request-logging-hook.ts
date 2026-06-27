import type { FastifyRequest } from "fastify";
import type { LoggerPort } from "../../../../packages/observability/src";
import { sanitizeLogMetadata } from "../../../../packages/observability/src";
import { getHeaderValue } from "../http/request-context";

export function logCompletedRequest(
  logger: LoggerPort,
  request: FastifyRequest,
  input: {
    readonly route: string;
    readonly statusCode: number;
    readonly durationMs: number;
  },
): void {
  logger.info({
    message: "api.request.completed",
    eventName: "api.request.completed",
    method: request.method,
    route: input.route,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    correlationId: getHeaderValue(request, "x-correlation-id"),
    tenantId: extractTenantId(request),
    actorId: getHeaderValue(request, "x-actor-id"),
    metadata: sanitizeLogMetadata({
      path: request.url,
      requestSource: getHeaderValue(request, "x-request-source") ?? "api",
    }),
  });
}

export function extractTenantId(request: FastifyRequest): string | undefined {
  const params = request.params;
  if (params && typeof params === "object" && "tenantId" in params) {
    const tenantId = (params as { tenantId?: unknown }).tenantId;
    return typeof tenantId === "string" ? tenantId : undefined;
  }

  return undefined;
}
