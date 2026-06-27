import type { FastifyInstance } from "fastify";
import { ok } from "../http/api-response";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () =>
    ok({
      service: "hyperion-api",
      status: "ok",
      database: "not_checked",
    }),
  );

  app.get("/api/v1/version", async () =>
    ok({
      service: "hyperion-api",
      version: "0.1.0",
      commit: "unknown",
    }),
  );
}
