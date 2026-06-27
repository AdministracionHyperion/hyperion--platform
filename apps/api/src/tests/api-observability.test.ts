import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { metricNames } from "../../../../packages/observability/src";
import { createApiApp } from "../app";
import { createFakeApiServices, type ApiServices } from "../services";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string; readonly message: string; readonly details?: unknown };
  readonly meta: { readonly correlationId: string; readonly tenantId?: string };
}

let app: FastifyInstance;
let services: ApiServices;

const tenantBase = "/api/v1/tenants/cedco-test";
const cedcoBase = `${tenantBase}/products/cedco/d02`;
const adminHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-observability-test",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-observability-voice",
};

beforeEach(async () => {
  services = createFakeApiServices();
  app = await createApiApp({ services });
});

afterEach(async () => {
  await app.close();
});

describe("API observability", () => {
  it("logs health requests without body data", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    const logs = services.observability?.getLogEntries?.() ?? [];

    expect(response.statusCode).toBe(200);
    expect(logs.some((entry) => entry.eventName === "api.request.completed")).toBe(true);
    expect(JSON.stringify(logs)).not.toContain("payload");
  });

  it("logs correlationId for protected routes", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });
    const logs = services.observability?.getLogEntries?.() ?? [];

    expect(response.statusCode).toBe(200);
    expect(logs.some((entry) => entry.correlationId === "corr-observability-test")).toBe(true);
  });

  it("records 401 metrics for missing actor", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-roles": "tenant-admin" },
    });
    const counters = services.observability?.metrics.snapshot().counters ?? [];

    expect(response.statusCode).toBe(401);
    expect(counters.some((counter) => counter.name === metricNames.httpRequestErrorsTotal)).toBe(
      true,
    );
  });

  it("records forbidden metrics", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents`,
      headers: { "x-actor-id": "actor-test", "x-actor-roles": "tenant-viewer" },
      payload: { agentId: "denied-agent", name: "Denied", defaultLocale: "es-CO" },
    });
    const counters = services.observability?.metrics.snapshot().counters ?? [];

    expect(response.statusCode).toBe(403);
    expect(counters.some((counter) => counter.name === metricNames.forbiddenRequestsTotal)).toBe(
      true,
    );
  });

  it("records validation metrics", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: "bad-call", direction: "outbound", metadata: { phoneNumber: "blocked" } },
    });
    const counters = services.observability?.metrics.snapshot().counters ?? [];

    expect(response.statusCode).toBe(400);
    expect(counters.some((counter) => counter.name === metricNames.validationErrorsTotal)).toBe(
      true,
    );
  });

  it("does not log forbidden payload values", async () => {
    await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: {
        callId: "bad-call",
        direction: "outbound",
        metadata: {
          token: "blocked-token",
          phone: "blocked-phone",
          rawTranscript: "blocked-transcript",
        },
      },
    });

    const logs = JSON.stringify(services.observability?.getLogEntries?.() ?? []);
    expect(logs).not.toContain("blocked-token");
    expect(logs).not.toContain("blocked-phone");
    expect(logs).not.toContain("blocked-transcript");
  });

  it("does not expose stack traces in error responses", async () => {
    app.get("/observability-test-boom", async () => {
      throw new Error("internal boom");
    });

    const response = await app.inject({ method: "GET", url: "/observability-test-boom" });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(500);
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("increments CEDCO D02 request metrics", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
    });
    const counters = services.observability?.metrics.snapshot().counters ?? [];

    expect(response.statusCode).toBe(200);
    expect(counters.some((counter) => counter.name === metricNames.cedcoD02RequestsTotal)).toBe(
      true,
    );
  });

  it("increments voice call contract request metrics", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: "call-observability-test", direction: "outbound" },
    });
    const counters = services.observability?.metrics.snapshot().counters ?? [];

    expect(response.statusCode).toBe(201);
    expect(
      counters.some((counter) => counter.name === metricNames.voiceCallContractRequestsTotal),
    ).toBe(true);
  });

  it("observes request duration", async () => {
    await app.inject({ method: "GET", url: "/health" });
    const observations = services.observability?.metrics.snapshot().observations ?? [];

    expect(
      observations.some((observation) => observation.name === metricNames.httpRequestDurationMs),
    ).toBe(true);
  });

  it("does not audit health", async () => {
    await app.inject({ method: "GET", url: "/health" });
    expect(services.observability?.getAuditEvents?.()).toEqual([]);
  });

  it("audits protected routes", async () => {
    await app.inject({ method: "GET", url: `${tenantBase}/context`, headers: adminHeaders });
    const auditEvents = services.observability?.getAuditEvents?.() ?? [];

    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0]).toMatchObject({
      tenantId: "cedco-test",
      actorId: "actor-test",
      result: "success",
    });
  });

  it("sanitizes audit metadata", async () => {
    await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls/call-observability-test/events`,
      headers: voiceHeaders,
      payload: { type: "status_changed", metadata: { email: "blocked@example.invalid" } },
    });
    const auditEvents = services.observability?.getAuditEvents?.() ?? [];

    expect(JSON.stringify(auditEvents)).not.toContain("blocked@example.invalid");
  });

  it("returns and logs incoming correlationId", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });
    const body = response.json<Envelope>();
    const logs = services.observability?.getLogEntries?.() ?? [];

    expect(body.meta.correlationId).toBe("corr-observability-test");
    expect(logs.some((entry) => entry.correlationId === "corr-observability-test")).toBe(true);
  });

  it("returns and logs generated correlationId", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-id": "actor-test", "x-actor-roles": "tenant-admin" },
    });
    const body = response.json<Envelope>();
    const logs = services.observability?.getLogEntries?.() ?? [];

    expect(body.meta.correlationId).toMatch(/^api-/u);
    expect(logs.some((entry) => entry.correlationId === body.meta.correlationId)).toBe(true);
  });

  it("does not log authorization or cookie headers", async () => {
    await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: {
        ...adminHeaders,
        authorization: "Bearer blocked-auth",
        cookie: "blocked-cookie=true",
      },
    });
    const logs = JSON.stringify(services.observability?.getLogEntries?.() ?? []);

    expect(logs).not.toContain("blocked-auth");
    expect(logs).not.toContain("blocked-cookie");
  });
});
