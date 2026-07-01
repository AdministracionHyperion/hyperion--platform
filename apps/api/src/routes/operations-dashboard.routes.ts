import { readFileSync } from "node:fs";
import type { FastifyInstance } from "fastify";
import type { OperationalDashboardReadModel } from "../../../../modules/core/operations-dashboard/src";
import { buildCedcoD02OperationalReport } from "../../../../modules/products/cedco/d02-calls/src/application/dashboard";
import { renderOperationalDashboardPage } from "../../../web/src/dashboard/operational-dashboard-page";
import { tenantParamsSchema } from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

const operationalDashboardStylesheet = readFileSync(
  new URL("../../../web/src/dashboard/styles/operational-dashboard.css", import.meta.url),
  "utf8",
);

export async function registerOperationsDashboardRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get(
    "/api/v1/tenants/:tenantId/products/cedco/d02/styles/operational-dashboard.css",
    async (request, reply) => {
      validateWithSchema(tenantParamsSchema, request.params);
      getRequiredRequestContext(request, ["tenant:read"]);
      reply.type("text/css; charset=utf-8");
      return operationalDashboardStylesheet;
    },
  );

  app.get("/api/v1/tenants/:tenantId/products/cedco/d02/dashboard", async (request, reply) => {
    validateWithSchema(tenantParamsSchema, request.params);
    const context = getRequiredRequestContext(request, [
      "tenant:read",
      "audit:read",
      "voice:call:read",
      "agent:read",
    ]);
    const dashboard = (await dependencies.services.operationsDashboard.getDashboard(
      context,
    )) as OperationalDashboardReadModel;
    reply.type("text/html; charset=utf-8");
    return renderOperationalDashboardPage(dashboard);
  });

  app.get(
    "/api/v1/tenants/:tenantId/products/cedco/d02/reports/operational-summary",
    async (request) => {
      validateWithSchema(tenantParamsSchema, request.params);
      const context = getRequiredRequestContext(request, [
        "tenant:read",
        "audit:read",
        "voice:call:read",
        "agent:read",
        "feedback:read",
      ]);
      const dashboard = (await dependencies.services.operationsDashboard.getDashboard(
        context,
      )) as OperationalDashboardReadModel;
      return ok(buildCedcoD02OperationalReport(dashboard), context);
    },
  );

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
