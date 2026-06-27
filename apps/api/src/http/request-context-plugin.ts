import type { FastifyInstance } from "fastify";
import { createLocalCorrelationId, getHeaderValue } from "./request-context";

export async function registerRequestContextPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request) => {
    if (!getHeaderValue(request, "x-correlation-id")) {
      request.headers["x-correlation-id"] = createLocalCorrelationId();
    }
    request.headers["x-request-received-at"] = new Date().toISOString();
  });
}
