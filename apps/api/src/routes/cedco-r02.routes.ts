import type { FastifyInstance } from "fastify";
import {
  availabilityQuerySchema,
  cedcoR02IdParamsSchema,
  cedcoR02ParamsSchema,
  createAgentBodyR02Schema,
  createAgentVersionBodyR02Schema,
  createAppointmentBodySchema,
  createAvailabilityBodySchema,
  createKnowledgeBaseBodySchema,
  rescheduleAppointmentBodySchema,
  searchKnowledgeBodySchema,
  simulateAgentFlowBodySchema,
  uploadKnowledgeDocumentBodySchema,
} from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerCedcoR02Routes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.post("/api/v1/tenants/:tenantId/r02/demo/seed", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(await dependencies.services.cedcoR02.seedDemo(context), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/calendar/availability", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const query = validateWithSchema(availabilityQuerySchema, request.query);
    const context = getRequiredRequestContext(request, ["tenant:read", "voice:call:read"]);
    return ok(await dependencies.services.cedcoR02.listAvailability(context, query), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/calendar/availability", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createAvailabilityBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createAvailability(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/appointments", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "voice:call:read"]);
    return ok(await dependencies.services.cedcoR02.listAppointments(context), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/appointments", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createAppointmentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createAppointment(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/appointments/:id/cancel", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(await dependencies.services.cedcoR02.cancelAppointment(context, params.id), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/appointments/:id/reschedule", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const body = validateWithSchema(rescheduleAppointmentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.rescheduleAppointment(context, params.id, body),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/google-calendar/:id/sync-test", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.runCalendarSyncTest(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-bases", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createKnowledgeBaseBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createKnowledgeBase(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/upload", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(uploadKnowledgeDocumentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.uploadKnowledgeDocument(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/:id/process", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(
      await dependencies.services.cedcoR02.processKnowledgeDocument(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/:id/approve", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(
      await dependencies.services.cedcoR02.approveKnowledgeDocument(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/:id/activate", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(
      await dependencies.services.cedcoR02.activateKnowledgeDocument(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge/search-test", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(searchKnowledgeBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    return ok(await dependencies.services.cedcoR02.searchKnowledge(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createAgentBodyR02Schema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createAgent(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents/:id/versions", async (request, reply) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const body = validateWithSchema(createAgentVersionBodyR02Schema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(
      await dependencies.services.cedcoR02.createAgentVersion(context, params.id, body),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents/:id/approve", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "version:activate"]);
    return ok(await dependencies.services.cedcoR02.approveAgent(context, params.id), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents/:id/activate", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "version:activate"]);
    return ok(await dependencies.services.cedcoR02.activateAgent(context, params.id), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agent-flow/simulate", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(simulateAgentFlowBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(await dependencies.services.cedcoR02.simulateAgentFlow(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/audit", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "audit:read"]);
    return ok(await dependencies.services.cedcoR02.listAudit(context), context);
  });
}
