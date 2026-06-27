import Fastify, { type FastifyInstance } from "fastify";
import { ApiError } from "./http/api-error";
import { fail } from "./http/api-response";
import { registerApiRoutes } from "./http/route-registry";
import { registerRequestContextPlugin } from "./http/request-context-plugin";
import { getHeaderValue } from "./http/request-context";
import { registerApiObservabilityPlugin } from "./observability";
import { registerApiAuthModePlugin, registerApiPolicyGatesPlugin } from "./security";
import { createFakeApiServices, type ApiServices } from "./services";
import type { ApiAuthMode } from "./config/api-config";

export interface CreateApiAppDependencies {
  readonly services?: ApiServices;
  readonly authMode?: ApiAuthMode;
}

export async function createApiApp(
  dependencies: CreateApiAppDependencies = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });
  const services = dependencies.services ?? createFakeApiServices();

  await registerApiObservabilityPlugin(app, services);
  await registerRequestContextPlugin(app);
  await registerApiAuthModePlugin(app, dependencies.authMode ?? "header-dev");
  await registerApiPolicyGatesPlugin(app, services);

  app.setErrorHandler((error, request, reply) => {
    const tenantId =
      typeof request.params === "object" && request.params && "tenantId" in request.params
        ? String((request.params as { tenantId?: string }).tenantId)
        : undefined;
    const correlationId = getHeaderValue(request, "x-correlation-id") ?? "public";

    if (error instanceof ApiError) {
      const errorLogEntry = {
        message: "api.request.error",
        eventName: "api.request.error",
        correlationId,
        ...(tenantId ? { tenantId } : {}),
        method: request.method,
        route: request.routeOptions.url ?? request.url,
        statusCode: error.statusCode,
        metadata: { code: error.code },
      };
      if (error.statusCode >= 500) {
        services.observability?.logger.error(errorLogEntry);
      } else {
        services.observability?.logger.warn(errorLogEntry);
      }
      reply
        .status(error.statusCode)
        .send(
          fail(
            error.code,
            error.message,
            { correlationId, ...(tenantId ? { tenantId } : {}) },
            error.details,
          ),
        );
      return;
    }

    services.observability?.logger.error({
      message: "api.request.error",
      eventName: "api.request.error",
      correlationId,
      ...(tenantId ? { tenantId } : {}),
      method: request.method,
      route: request.routeOptions.url ?? request.url,
      statusCode: 500,
      metadata: { code: "internal_error" },
    });

    reply.status(500).send(
      fail("internal_error", "Unexpected API error.", {
        correlationId,
        ...(tenantId ? { tenantId } : {}),
      }),
    );
  });

  await registerApiRoutes(app, { services });

  return app;
}
