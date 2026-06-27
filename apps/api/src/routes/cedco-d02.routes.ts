import type { FastifyInstance } from "fastify";
import {
  cedcoD02ParamsSchema,
  cedcoConfigurationSchema,
  classifyCedcoIntentBodySchema,
  createCedcoEligibilityCheckBodySchema,
  createCedcoSchedulingRequestBodySchema,
  evaluateCedcoComplianceBodySchema,
  evaluateCedcoHandoffBodySchema,
  evaluateCedcoReadinessBodySchema,
  runCedcoD02DialerDryRunBodySchema,
} from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerCedcoD02Routes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get("/api/v1/tenants/:tenantId/products/cedco/d02/configuration", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    const configuration = await dependencies.services.cedcoD02.getConfiguration(context);
    return ok(configuration, context);
  });

  app.put("/api/v1/tenants/:tenantId/products/cedco/d02/configuration", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const body = validateWithSchema(cedcoConfigurationSchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    const configuration = await dependencies.services.cedcoD02.updateConfiguration(context, body);
    return ok(configuration, context);
  });

  app.post("/api/v1/tenants/:tenantId/products/cedco/d02/intents/classify", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const body = validateWithSchema(classifyCedcoIntentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write", "agent:read"]);
    const classification = await dependencies.services.cedcoD02.classifyIntent(context, body);
    return ok(classification, context);
  });

  app.post("/api/v1/tenants/:tenantId/products/cedco/d02/readiness/evaluate", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const body = validateWithSchema(evaluateCedcoReadinessBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    const readiness = await dependencies.services.cedcoD02.evaluateReadiness(context, body);
    return ok(readiness, context);
  });

  app.post("/api/v1/tenants/:tenantId/products/cedco/d02/compliance/evaluate", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const body = validateWithSchema(evaluateCedcoComplianceBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write", "audit:read"]);
    const compliance = await dependencies.services.cedcoD02.evaluateCompliance(context, body);
    return ok(compliance, context);
  });

  app.post("/api/v1/tenants/:tenantId/products/cedco/d02/handoff/evaluate", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const body = validateWithSchema(evaluateCedcoHandoffBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write"]);
    const handoff = await dependencies.services.cedcoD02.evaluateHandoff(context, body);
    return ok(handoff, context);
  });

  app.post("/api/v1/tenants/:tenantId/products/cedco/d02/dialer/dry-run", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const body = validateWithSchema(runCedcoD02DialerDryRunBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["voice:call:write", "agent:read"]);
    const idempotencyKey =
      body.idempotency_key ?? getSingleHeader(request.headers["idempotency-key"]);
    const result = await dependencies.services.cedcoD02.runDialerDryRun(context, {
      ...body,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    });
    return ok(result, context);
  });

  app.post(
    "/api/v1/tenants/:tenantId/products/cedco/d02/scheduling/requests",
    async (request, reply) => {
      validateWithSchema(cedcoD02ParamsSchema, request.params);
      const body = validateWithSchema(createCedcoSchedulingRequestBodySchema, request.body);
      const context = getRequiredRequestContext(request, ["voice:call:write"]);
      const scheduling = await dependencies.services.cedcoD02.createSchedulingRequest(
        context,
        body,
      );
      reply.code(201);
      return ok(scheduling, context);
    },
  );

  app.post(
    "/api/v1/tenants/:tenantId/products/cedco/d02/eligibility/checks",
    async (request, reply) => {
      validateWithSchema(cedcoD02ParamsSchema, request.params);
      const body = validateWithSchema(createCedcoEligibilityCheckBodySchema, request.body);
      const context = getRequiredRequestContext(request, ["voice:call:write"]);
      const eligibility = await dependencies.services.cedcoD02.createEligibilityCheck(
        context,
        body,
      );
      reply.code(201);
      return ok(eligibility, context);
    },
  );

  app.get("/api/v1/tenants/:tenantId/products/cedco/d02/metrics/summary", async (request) => {
    validateWithSchema(cedcoD02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["feedback:read", "tenant:read"]);
    const summary = await dependencies.services.cedcoD02.getMetricsSummary(context);
    return ok(summary, context);
  });
}

function getSingleHeader(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}
