import type { FastifyInstance } from "fastify";
import { internalDialerDryRunBodySchema, internalDialerParamsSchema } from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerInternalDialerReadinessRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get("/api/v1/tenants/:tenantId/integrations/internal-dialer/readiness", async (request) => {
    validateWithSchema(internalDialerParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "voice:call:read"]);
    const readiness = await dependencies.services.internalDialer.getReadiness(context);
    return ok(readiness, context);
  });

  app.post("/api/v1/tenants/:tenantId/integrations/internal-dialer/dry-run", async (request) => {
    validateWithSchema(internalDialerParamsSchema, request.params);
    const body = validateWithSchema(internalDialerDryRunBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write"]);
    const result = await dependencies.services.internalDialer.dryRun(context, {
      ...body,
      idempotency_key: body.idempotency_key ?? getSingleHeader(request.headers["idempotency-key"]),
    });
    return ok(result, context);
  });
}

function getSingleHeader(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}
