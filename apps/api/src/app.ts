import Fastify, { type FastifyInstance } from "fastify";
import { ApiError } from "./http/api-error";
import { fail } from "./http/api-response";
import { registerApiRoutes } from "./http/route-registry";
import { registerRequestContextPlugin } from "./http/request-context-plugin";
import { getHeaderValue } from "./http/request-context";
import { createFakeApiServices, type ApiServices } from "./services";

export interface CreateApiAppDependencies {
  readonly services?: ApiServices;
}

export async function createApiApp(
  dependencies: CreateApiAppDependencies = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });
  const services = dependencies.services ?? createFakeApiServices();

  await registerRequestContextPlugin(app);

  app.setErrorHandler((error, request, reply) => {
    const tenantId =
      typeof request.params === "object" && request.params && "tenantId" in request.params
        ? String((request.params as { tenantId?: string }).tenantId)
        : undefined;
    const correlationId = getHeaderValue(request, "x-correlation-id") ?? "public";

    if (error instanceof ApiError) {
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
