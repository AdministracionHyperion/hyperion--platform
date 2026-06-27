import type { FastifyInstance } from "fastify";
import { coreContextParamsSchema, coreFeatureFlagParamsSchema } from "../contracts";
import { getRequiredRequestContext } from "../http/request-context";
import { ok } from "../http/api-response";
import { validateWithSchema } from "../http/validation";
import type { RouteRegistryDependencies } from "../http/route-registry";

export async function registerCoreRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get("/api/v1/tenants/:tenantId/context", async (request) => {
    validateWithSchema(coreContextParamsSchema, request.params);
    const context = getRequiredRequestContext(request);
    return ok(
      {
        tenantId: context.tenantId,
        actorId: context.actorId,
        roles: context.roles,
        correlationId: context.correlationId,
      },
      context,
    );
  });

  app.get("/api/v1/tenants/:tenantId/features/:flagKey", async (request) => {
    const params = validateWithSchema(coreFeatureFlagParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read"]);
    const flag = await dependencies.services.core.getFeatureFlag(context, params.flagKey);
    return ok(flag, context);
  });
}
