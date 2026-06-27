import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRateLimitRule } from "../../../../modules/core/rate-limits/src";
import { metricNames } from "../../../../packages/observability/src";
import { createApiApp } from "../app";
import { createFakeApiServices, type ApiServices } from "../services";

interface Envelope {
  readonly ok: boolean;
  readonly error?: { readonly code: string; readonly details?: unknown };
  readonly meta: { readonly correlationId: string };
}

let app: FastifyInstance;
let services: ApiServices;

const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-rate-limit-test",
};

beforeEach(async () => {
  services = createFakeApiServices();
  services.security?.setRateLimitRuleForTests?.(
    createRateLimitRule({
      ruleId: "test-low-limit",
      scope: "tenant_actor",
      limit: 1,
      windowMs: 60_000,
    }),
  );
  app = await createApiApp({ services });
});

afterEach(async () => {
  await app.close();
});

describe("API rate limits", () => {
  it("allows requests within the limit", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/context",
      headers,
    });

    expect(response.statusCode).toBe(200);
  });

  it("returns 429 when limit is exceeded with correlationId", async () => {
    await app.inject({ method: "GET", url: "/api/v1/tenants/cedco-test/context", headers });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/context",
      headers,
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(429);
    expect(body.error?.code).toBe("rate_limit_exceeded");
    expect(body.meta.correlationId).toBe("corr-rate-limit-test");
    expect(JSON.stringify(body)).not.toContain("phone");
  });

  it("records rate limit metrics and logs", async () => {
    await app.inject({ method: "GET", url: "/api/v1/tenants/cedco-test/context", headers });
    await app.inject({ method: "GET", url: "/api/v1/tenants/cedco-test/context", headers });

    const counters = services.observability?.metrics.snapshot().counters ?? [];
    const logs = services.observability?.getLogEntries?.() ?? [];

    expect(counters.some((counter) => counter.name === metricNames.rateLimitDeniedTotal)).toBe(
      true,
    );
    expect(logs.some((entry) => entry.eventName === "rate_limit.denied")).toBe(true);
  });
});
