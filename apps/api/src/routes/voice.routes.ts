import type { FastifyInstance } from "fastify";
import {
  createVoiceCallBodySchema,
  createVoiceCallEventBodySchema,
  createVoiceCallEventParamsSchema,
  createVoiceCallParamsSchema,
  getVoiceCallParamsSchema,
} from "../contracts";
import { notFoundError } from "../http/api-error";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerVoiceRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.post("/api/v1/tenants/:tenantId/voice/calls", async (request, reply) => {
    validateWithSchema(createVoiceCallParamsSchema, request.params);
    const body = validateWithSchema(createVoiceCallBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write"]);
    const call = await dependencies.services.voice.createCall(context, body);
    reply.code(201);
    return ok(call, context);
  });

  app.post("/api/v1/tenants/:tenantId/voice/calls/:callId/events", async (request, reply) => {
    const params = validateWithSchema(createVoiceCallEventParamsSchema, request.params);
    const body = validateWithSchema(createVoiceCallEventBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write"]);
    const event = await dependencies.services.voice.registerCallEvent(context, params.callId, body);
    reply.code(201);
    return ok(event, context);
  });

  app.get("/api/v1/tenants/:tenantId/voice/calls/:callId", async (request) => {
    const params = validateWithSchema(getVoiceCallParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["voice:call:read"]);
    const call = await dependencies.services.voice.getCall(context, params.callId);
    if (!call) {
      throw notFoundError("Call session was not found.");
    }
    return ok(call, context);
  });
}
