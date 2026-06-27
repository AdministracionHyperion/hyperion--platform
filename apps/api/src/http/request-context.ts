import type { FastifyRequest } from "fastify";
import { createActorId } from "../../../../modules/core/identity-access/src/actor-id";
import type { Permission } from "../../../../modules/core/identity-access/src/permission";
import { rolesAllow } from "../../../../modules/core/identity-access/src/rbac-policy";
import type { Role } from "../../../../modules/core/identity-access/src/role";
import { createTenantId } from "../../../../modules/core/tenancy/src/tenant-id";
import { forbiddenError, missingActorError, validationError } from "./api-error";

const allowedRoles: ReadonlySet<Role> = new Set<Role>([
  "super-admin",
  "tenant-admin",
  "voice-manager",
  "voice-operator",
  "tenant-viewer",
  "auditor",
]);

export interface RequestContext {
  tenantId: string;
  actorId: string;
  roles: Role[];
  correlationId: string;
  source: string;
  occurredAt: Date;
}

export interface TenantParams {
  tenantId: string;
}

export function createLocalCorrelationId(): string {
  return `api-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getHeaderValue(request: FastifyRequest, headerName: string): string | undefined {
  const raw = request.headers[headerName.toLowerCase()];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
}

export function parseRoles(headerValue: string): Role[] {
  const roles = headerValue
    .split(",")
    .map((role) => role.trim())
    .filter((role) => role.length > 0);

  if (roles.length === 0) {
    throw missingActorError("Actor roles are required.");
  }

  const invalidRole = roles.find((role) => !allowedRoles.has(role as Role));
  if (invalidRole) {
    throw validationError(`Unsupported actor role: ${invalidRole}`);
  }

  return roles as Role[];
}

export function buildRequestContext(request: FastifyRequest, tenantId: string): RequestContext {
  const tenantResult = createTenantId(tenantId);
  if (!tenantResult.ok) {
    throw validationError("Invalid tenantId.", { tenantId });
  }

  const actorHeader = getHeaderValue(request, "x-actor-id");
  if (!actorHeader) {
    throw missingActorError("x-actor-id header is required.");
  }

  const actorResult = createActorId(actorHeader);
  if (!actorResult.ok) {
    throw validationError("Invalid actorId.", { actorId: actorHeader });
  }

  const roleHeader = getHeaderValue(request, "x-actor-roles");
  if (!roleHeader) {
    throw missingActorError("x-actor-roles header is required.");
  }

  const correlationId = getHeaderValue(request, "x-correlation-id") ?? createLocalCorrelationId();

  return {
    tenantId: tenantResult.value,
    actorId: actorResult.value,
    roles: parseRoles(roleHeader),
    correlationId,
    source: getHeaderValue(request, "x-request-source") ?? "api",
    occurredAt: new Date(),
  };
}

export function getRequiredRequestContext(
  request: FastifyRequest,
  requiredPermissions: Permission[] = [],
): RequestContext {
  const params = request.params as Partial<TenantParams>;
  if (!params.tenantId) {
    throw validationError("tenantId path parameter is required.");
  }

  const context = buildRequestContext(request, params.tenantId);
  const allowed =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) => rolesAllow(context.roles, permission));
  if (!allowed) {
    throw forbiddenError();
  }

  return context;
}
