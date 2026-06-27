import type { FastifyInstance } from "fastify";
import { mockProviderEventBodySchema, createVoiceCallParamsSchema } from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerMockProviderEventRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.post("/api/v1/tenants/:tenantId/voice/mock-provider-events", async (request, reply) => {
    validateWithSchema(createVoiceCallParamsSchema, request.params);
    const body = validateWithSchema(mockProviderEventBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write"]);
    const result = await dependencies.services.voice.ingestMockProviderEvent(
      context,
      body,
      request.headers as Readonly<Record<string, unknown>>,
    );
    reply.code(202);
    return ok(result, context);
  });
}
