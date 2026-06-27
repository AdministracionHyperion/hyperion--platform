import type { FastifyInstance } from "fastify";
import { tenantParamsSchema } from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerOperationsDashboardRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get("/api/v1/tenants/:tenantId/operations/dashboard", async (request) => {
    validateWithSchema(tenantParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "audit:read"]);
    const dashboard = await dependencies.services.operationsDashboard.getDashboard(context);
    return ok(dashboard, context);
  });

  app.get("/api/v1/tenants/:tenantId/operations/dashboard/mock-call-flows", async (request) => {
    validateWithSchema(tenantParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "voice:call:read"]);
    const flows = await dependencies.services.operationsDashboard.getMockCallFlows(context);
    return ok(flows, context);
  });

  app.get("/api/v1/tenants/:tenantId/operations/dashboard/provider-events", async (request) => {
    validateWithSchema(tenantParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "audit:read"]);
    const events = await dependencies.services.operationsDashboard.getProviderEvents(context);
    return ok(events, context);
  });

  app.get("/api/v1/tenants/:tenantId/operations/dashboard/evals", async (request) => {
    validateWithSchema(tenantParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    const evalSummary = await dependencies.services.operationsDashboard.getEvalSummary(context);
    return ok(evalSummary, context);
  });
}
