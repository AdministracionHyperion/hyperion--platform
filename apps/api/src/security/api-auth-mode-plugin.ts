import type { FastifyInstance } from "fastify";
import type { ApiAuthMode } from "../config/api-config";
import { missingActorError, runtimeActionBlockedError } from "../http/api-error";
import type { ApiAuthServices } from "../services";

const publicRoutes = new Set([
  "/health",
  "/api/v1/version",
  "/api/v1/auth/login",
  "/api/v1/auth/whoami",
  "/api/v1/auth/logout",
]);

export async function registerApiAuthModePlugin(
  app: FastifyInstance,
  authMode: ApiAuthMode,
  auth?: ApiAuthServices,
): Promise<void> {
  app.addHook("preHandler", async (request) => {
    const routePath = request.routeOptions.url ?? request.url.split("?")[0] ?? request.url;
    if (publicRoutes.has(routePath)) {
      return;
    }

    if (authMode === "header-dev") {
      return;
    }

    if (authMode === "jwt-required") {
      throw runtimeActionBlockedError(
        "JWT auth is required before protected API routes can run outside header-dev mode.",
        { authMode },
      );
    }

    if (!auth) {
      throw runtimeActionBlockedError("Local staging auth service is not configured.", {
        authMode,
      });
    }

    const tenantId = extractTenantId(request.url);
    if (!tenantId) {
      throw missingActorError("Tenant-scoped local staging session is required.");
    }
    const sessionToken = extractSessionToken(request.headers);
    if (!sessionToken) {
      throw missingActorError("Local staging session is required.");
    }
    const principal = await auth.resolveSession(sessionToken, tenantId);
    if (!principal) {
      throw missingActorError("Local staging session is invalid or expired.");
    }

    request.headers["x-actor-id"] = principal.actorId;
    request.headers["x-actor-roles"] = principal.roles.join(",");
    request.headers["x-request-source"] = "local-staging-auth";
  });
}

function extractTenantId(url: string): string | undefined {
  const match = /^\/api\/v1\/tenants\/([^/]+)/u.exec(url);
  return match ? decodeURIComponent(match[1]!) : undefined;
}

function extractSessionToken(headers: Readonly<Record<string, unknown>>): string | undefined {
  const authorization = headerString(headers.authorization);
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const bearerValue = authorization.slice("bearer ".length).trim();
    return bearerValue.length > 0 ? bearerValue : undefined;
  }

  const cookie = headerString(headers.cookie);
  if (!cookie) {
    return undefined;
  }
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "hyperion_session") {
      const value = rest.join("=").trim();
      return value.length > 0 ? decodeURIComponent(value) : undefined;
    }
  }
  return undefined;
}

function headerString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}
