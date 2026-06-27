import type { FastifyRequest } from "fastify";
import { metricNames, sanitizeLogMetadata } from "../../../../packages/observability/src";
import { getHeaderValue } from "../http/request-context";
import type { ApiObservabilityServices } from "../services/api-services";
import { extractTenantId } from "./request-logging-hook";

export async function recordRequestAudit(
  observability: ApiObservabilityServices,
  request: FastifyRequest,
  input: {
    readonly route: string;
    readonly statusCode: number;
  },
): Promise<void> {
  if (!isProtectedRoute(input.route)) {
    return;
  }

  const correlationId = getHeaderValue(request, "x-correlation-id") ?? "missing-correlation";
  const event = {
    tenantId: extractTenantId(request),
    actorId: getHeaderValue(request, "x-actor-id"),
    correlationId,
    action: inferAuditAction(request.method, input.route, input.statusCode),
    resourceType: inferResourceType(input.route),
    resourceId: inferResourceId(request, input.route),
    result: input.statusCode >= 400 ? ("failure" as const) : ("success" as const),
    metadata: sanitizeLogMetadata({
      method: request.method,
      route: input.route,
      statusCode: input.statusCode,
    }),
    occurredAt: new Date(),
  };

  observability.metrics.increment(metricNames.auditEventsTotal, {
    action: event.action,
    result: event.result,
  });

  if (observability.recordAuditEvent) {
    await observability.recordAuditEvent(event);
    return;
  }

  observability.logger.info({
    message: "api.audit.fallback",
    eventName: "api.audit.fallback",
    correlationId,
    tenantId: event.tenantId,
    actorId: event.actorId,
    metadata: event.metadata,
  });
}

function isProtectedRoute(route: string): boolean {
  return route.startsWith("/api/v1/tenants/");
}

function inferAuditAction(method: string, route: string, statusCode: number): string {
  const normalizedRoute = route.toLowerCase();
  if (statusCode === 400) {
    return "api.validation_failed";
  }
  if (statusCode === 403) {
    return "api.forbidden";
  }
  if (statusCode === 404) {
    return "api.not_found";
  }
  if (statusCode >= 500) {
    return "api.error";
  }
  if (method === "POST" && /\/agents$/u.test(normalizedRoute)) {
    return "agent.create";
  }
  if (method === "POST" && /\/agents\/[^/]+\/versions$/u.test(normalizedRoute)) {
    return "agent.version.create";
  }
  if (method === "POST" && /\/voice\/calls$/u.test(normalizedRoute)) {
    return "voice.call.create";
  }
  if (method === "POST" && /\/voice\/calls\/[^/]+\/events$/u.test(normalizedRoute)) {
    return "voice.call.event.create";
  }
  if (/\/products\/cedco\/d02\/configuration$/u.test(normalizedRoute) && method === "GET") {
    return "cedco.d02.config.read";
  }
  if (/\/products\/cedco\/d02\/configuration$/u.test(normalizedRoute) && method === "PUT") {
    return "cedco.d02.config.update";
  }
  if (/\/intents\/classify$/u.test(normalizedRoute)) {
    return "cedco.d02.intent.classify";
  }
  if (/\/readiness\/evaluate$/u.test(normalizedRoute)) {
    return "cedco.d02.readiness.evaluate";
  }
  if (/\/compliance\/evaluate$/u.test(normalizedRoute)) {
    return "cedco.d02.compliance.evaluate";
  }
  if (/\/handoff\/evaluate$/u.test(normalizedRoute)) {
    return "cedco.d02.handoff.evaluate";
  }
  if (/\/scheduling\/requests$/u.test(normalizedRoute)) {
    return "cedco.d02.scheduling.request";
  }
  if (/\/eligibility\/checks$/u.test(normalizedRoute)) {
    return "cedco.d02.eligibility.check";
  }
  if (/\/metrics\/summary$/u.test(normalizedRoute)) {
    return "cedco.d02.metrics.read";
  }
  if (/\/mock-call-flows$/u.test(normalizedRoute)) {
    return "cedco.d02.mock_flow.run";
  }

  return "api.request";
}

function inferResourceType(route: string): string {
  if (route.includes("/agents")) {
    return "agent";
  }
  if (route.includes("/voice/calls")) {
    return "voice_call";
  }
  if (route.includes("/products/cedco/d02")) {
    return "cedco_d02";
  }
  if (route.includes("/features")) {
    return "feature_flag";
  }
  return "api";
}

function inferResourceId(request: FastifyRequest, route: string): string {
  const params = request.params as Record<string, unknown>;
  for (const key of ["callId", "agentId", "flagKey", "tenantId"]) {
    const value = params[key];
    if (typeof value === "string") {
      return value;
    }
  }

  return route;
}
