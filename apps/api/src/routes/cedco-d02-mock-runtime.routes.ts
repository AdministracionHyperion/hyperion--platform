import type { FastifyInstance } from "fastify";
import { cedcoD02ParamsSchema, runCedcoD02MockCallFlowBodySchema } from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerCedcoD02MockRuntimeRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.post(
    "/api/v1/tenants/:tenantId/products/cedco/d02/mock-call-flows",
    async (request, reply) => {
      validateWithSchema(cedcoD02ParamsSchema, request.params);
      const body = validateWithSchema(runCedcoD02MockCallFlowBodySchema, request.body);
      const context = getRequiredRequestContext(request, ["voice:call:write", "agent:read"]);
      const result = await dependencies.services.cedcoD02.runMockCallFlow(context, body);
      reply.code(201);
      return ok(result, context);
    },
  );
}
