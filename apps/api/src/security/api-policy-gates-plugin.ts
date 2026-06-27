import type { FastifyInstance } from "fastify";
import type { ApiServices } from "../services";
import { enforceApiRateLimit } from "./api-rate-limit-hook";
import { enforceRuntimeBlockers } from "./api-runtime-blockers-hook";

export async function registerApiPolicyGatesPlugin(
  app: FastifyInstance,
  services: ApiServices,
): Promise<void> {
  app.addHook("preHandler", async (request) => {
    const route = request.routeOptions.url ?? request.url.split("?")[0] ?? "unknown";
    await enforceApiRateLimit(services, request, route);
    await enforceRuntimeBlockers(services, request, route);
  });
}
