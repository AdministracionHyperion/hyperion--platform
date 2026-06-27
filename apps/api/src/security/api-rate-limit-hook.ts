import type { FastifyRequest } from "fastify";
import { checkRateLimit } from "../../../../modules/core/rate-limits/src";
import { rateLimitExceededError } from "../http/api-error";
import { getHeaderValue } from "../http/request-context";
import type { ApiServices } from "../services";

export async function enforceApiRateLimit(
  services: ApiServices,
  request: FastifyRequest,
  route: string,
): Promise<void> {
  const security = services.security;
  if (!security) {
    return;
  }

  const result = await checkRateLimit({
    store: security.rateLimitStore,
    rule: security.getRateLimitRule({ method: request.method, route }),
    tenantId: extractTenantId(request),
    actorId: getHeaderValue(request, "x-actor-id"),
    route,
    method: request.method,
    logger: services.observability?.logger,
    metrics: services.observability?.metrics,
  });

  if (!result.allowed) {
    throw rateLimitExceededError("Rate limit exceeded.", {
      retryAfterMs: result.retryAfterMs,
      resetAt: result.resetAt.toISOString(),
      ruleId: result.ruleId,
      remaining: result.remaining,
    });
  }
}

function extractTenantId(request: FastifyRequest): string | undefined {
  const params = request.params;
  if (params && typeof params === "object" && "tenantId" in params) {
    const tenantId = (params as { tenantId?: unknown }).tenantId;
    return typeof tenantId === "string" ? tenantId : undefined;
  }

  return undefined;
}
