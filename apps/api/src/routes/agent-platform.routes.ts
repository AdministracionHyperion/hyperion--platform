import type { FastifyInstance } from "fastify";
import {
  createAgentBodySchema,
  createAgentParamsSchema,
  createAgentVersionBodySchema,
  createAgentVersionParamsSchema,
} from "../contracts";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import { validateWithSchema } from "../http/validation";

export async function registerAgentPlatformRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.post("/api/v1/tenants/:tenantId/agents", async (request, reply) => {
    validateWithSchema(createAgentParamsSchema, request.params);
    const body = validateWithSchema(createAgentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["agent:write"]);
    const agent = await dependencies.services.agentPlatform.createAgent(context, body);
    reply.code(201);
    return ok(agent, context);
  });

  app.post("/api/v1/tenants/:tenantId/agents/:agentId/versions", async (request, reply) => {
    const params = validateWithSchema(createAgentVersionParamsSchema, request.params);
    const body = validateWithSchema(createAgentVersionBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["agent:write"]);
    const version = await dependencies.services.agentPlatform.createAgentVersion(
      context,
      params.agentId,
      body,
    );
    reply.code(201);
    return ok(version, context);
  });
}
