import type { FastifyInstance } from "fastify";
import { ok } from "../http/api-response";
import { getHeaderValue } from "../http/request-context";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (request) =>
    ok(
      {
        service: "hyperion-api",
        status: "ok",
        database: "not_checked",
      },
      { correlationId: getHeaderValue(request, "x-correlation-id") ?? "public" },
    ),
  );

  app.get("/api/v1/version", async (request) =>
    ok(
      {
        service: "hyperion-api",
        version: "0.1.0",
        commit: "unknown",
      },
      { correlationId: getHeaderValue(request, "x-correlation-id") ?? "public" },
    ),
  );
}
