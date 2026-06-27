import type { FastifyRequest } from "fastify";
import { metricNames, sanitizeLogMetadata } from "../../../../packages/observability/src";
import { createOperationContext } from "../../../../packages/shared/src/core";
import { createActorId } from "../../../../modules/core/identity-access/src/actor-id";
import { evaluatePolicyGate } from "../../../../modules/core/policy-gates/src";
import { dangerousPayloadError, policyGateToApiError } from "./api-policy-gate-errors";
import { findProtectedAction, isRecord } from "./protected-action-map";
import { getHeaderValue, parseRoles } from "../http/request-context";
import type { ApiServices } from "../services";

const dangerousPayloadFields = new Set([
  "phoneNumber",
  "to_number",
  "from_number",
  "rawTranscript",
  "transcript",
  "audioUrl",
  "recordingUrl",
  "apiKey",
  "token",
  "secret",
  "password",
]);

export async function enforceRuntimeBlockers(
  services: ApiServices,
  request: FastifyRequest,
  route: string,
): Promise<void> {
  const dangerousField = findDangerousPayloadField(request.body);
  if (dangerousField) {
    services.observability?.metrics.increment(metricNames.runtimeBlockedRequestsTotal, {
      route,
      reason: "dangerous_payload",
    });
    services.observability?.logger.warn({
      message: "runtime.payload.blocked",
      eventName: "runtime.payload.blocked",
      correlationId: getHeaderValue(request, "x-correlation-id"),
      tenantId: extractTenantId(request),
      actorId: getHeaderValue(request, "x-actor-id"),
      route,
      method: request.method,
      metadata: sanitizeLogMetadata({ field: dangerousField }),
    });
    throw dangerousPayloadError(dangerousField);
  }

  const action = findProtectedAction(request);
  if (!action) {
    return;
  }

  const context = buildPolicyContext(request, route);
  const result = await evaluatePolicyGate({
    context: context.operationContext,
    actor: context.actor,
    action: action.action,
    flags: services.security?.runtimeSafetyFlags,
    metadata: { route, method: request.method, reason: action.reason },
    logger: services.observability?.logger,
    metrics: services.observability?.metrics,
  });

  if (!result.allowed) {
    services.observability?.metrics.increment(metricNames.runtimeBlockedRequestsTotal, {
      route,
      action: result.action,
    });
    if (result.action === "provider.egress") {
      services.observability?.metrics.increment(metricNames.providerBlockedRequestsTotal, {
        route,
      });
    }

    await services.observability?.recordAuditEvent?.({
      tenantId: context.operationContext.tenantId,
      actorId: context.operationContext.actorId,
      correlationId: context.operationContext.correlationId,
      action: "policy.gate.denied",
      resourceType: "policy_gate",
      resourceId: result.action,
      result: "failure",
      metadata: {
        reasons: result.reasons,
        requiredFlags: result.requiredFlags,
        requiredPermissions: result.requiredPermissions,
      },
      occurredAt: context.operationContext.occurredAt,
    });

    throw policyGateToApiError(result);
  }
}

function findDangerousPayloadField(value: unknown, path = "body"): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const currentPath = `${path}.${key}`;
    if (dangerousPayloadFields.has(key)) {
      return currentPath;
    }
    const nested = findDangerousPayloadField(nestedValue, currentPath);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function buildPolicyContext(request: FastifyRequest, route: string) {
  const tenantId = extractTenantId(request);
  if (!tenantId) {
    throw dangerousPayloadError("tenantId");
  }
  const actorId = getHeaderValue(request, "x-actor-id") ?? "";
  const actorResult = createActorId(actorId);
  if (!actorResult.ok) {
    throw dangerousPayloadError("x-actor-id");
  }
  const roles = parseRoles(getHeaderValue(request, "x-actor-roles") ?? "");
  const operationContext = createOperationContext({
    tenantId,
    actorId,
    correlationId: getHeaderValue(request, "x-correlation-id") ?? `policy-${Date.now()}`,
    source: getHeaderValue(request, "x-request-source") ?? "api",
  });
  if (!operationContext.ok) {
    throw dangerousPayloadError(route);
  }

  return {
    operationContext: operationContext.value,
    actor: {
      actorId: actorResult.value,
      tenantId,
      roles,
    },
  };
}

function extractTenantId(request: FastifyRequest): string | undefined {
  const params = request.params;
  if (params && typeof params === "object" && "tenantId" in params) {
    const tenantId = (params as { tenantId?: unknown }).tenantId;
    return typeof tenantId === "string" ? tenantId : undefined;
  }

  const match = /\/api\/v1\/tenants\/([^/]+)/u.exec(request.url);
  return match?.[1];
}
