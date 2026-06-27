import type { FastifyInstance } from "fastify";

export async function registerRequestContextPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request) => {
    request.headers["x-request-received-at"] = new Date().toISOString();
  });
}
