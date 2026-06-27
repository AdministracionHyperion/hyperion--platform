import type { FastifyInstance } from "fastify";
import type { ApiAuthMode } from "../config/api-config";
import { runtimeActionBlockedError } from "../http/api-error";

const publicRoutes = new Set(["/health", "/api/v1/version"]);

export async function registerApiAuthModePlugin(
  app: FastifyInstance,
  authMode: ApiAuthMode,
): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (authMode !== "jwt-required" || publicRoutes.has(request.url)) {
      return;
    }

    throw runtimeActionBlockedError(
      "JWT auth is required before protected API routes can run outside header-dev mode.",
      { authMode },
    );
  });
}
