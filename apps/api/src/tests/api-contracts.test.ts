import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
  readonly meta: { readonly correlationId: string; readonly tenantId?: string };
}

let app: FastifyInstance;

const tenantBase = "/api/v1/tenants/cedco-test";
const adminHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-test-001",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
};

beforeEach(async () => {
  app = await createApiApp({ services: createFakeApiServices() });
});

afterEach(async () => {
  await app.close();
});

describe("API public contracts", () => {
  it("returns health without actor context", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({ service: "hyperion-api", status: "ok" });
  });

  it("returns version without actor context", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/version" });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({ service: "hyperion-api", commit: "unknown" });
  });
});

describe("API request context and RBAC", () => {
  it("rejects protected routes without actor id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-roles": "tenant-admin" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(401);
    expect(body.error?.code).toBe("missing_actor");
  });

  it("rejects protected routes without actor roles", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-id": "actor-test" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(401);
    expect(body.error?.code).toBe("missing_actor");
  });

  it("generates correlationId when it is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-id": "actor-test", "x-actor-roles": "tenant-admin" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.meta.correlationId).toMatch(/^api-/u);
  });

  it("preserves incoming correlationId", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.meta.correlationId).toBe("corr-test-001");
  });

  it("rejects invalid tenantId", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/CEDCO/context",
      headers: adminHeaders,
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(400);
    expect(body.error?.code).toBe("validation_error");
  });

  it("rejects tenant viewer when creating agents", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents`,
      headers: { "x-actor-id": "actor-test", "x-actor-roles": "tenant-viewer" },
      payload: { agentId: "cedco-agent", name: "CEDCO Agent", defaultLocale: "es-CO" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(403);
    expect(body.error?.code).toBe("forbidden");
  });

  it("allows voice operator to create a voice call draft", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: "call-test-001", direction: "outbound" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(201);
    expect(body.data).toMatchObject({
      callId: "call-test-001",
      status: "draft",
      dispatch: "not_started",
    });
  });

  it.each(["phoneNumber", "rawTranscript", "audioUrl"])(
    "rejects forbidden payload field %s",
    async (field) => {
      const response = await app.inject({
        method: "POST",
        url: `${tenantBase}/voice/calls`,
        headers: voiceHeaders,
        payload: {
          callId: "call-test-002",
          direction: "outbound",
          metadata: { [field]: "forbidden-value" },
        },
      });
      const body = response.json<Envelope>();

      expect(response.statusCode).toBe(400);
      expect(body.error?.code).toBe("validation_error");
    },
  );
});

describe("Agent and Voice route contracts", () => {
  it("creates an agent draft through the injected fake services", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents`,
      headers: adminHeaders,
      payload: {
        agentId: "cedco-main-agent",
        name: "CEDCO Main Agent",
        defaultLocale: "es-CO",
      },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(201);
    expect(body.data).toMatchObject({ agentId: "cedco-main-agent", status: "draft" });
    expect(JSON.stringify(body.data)).not.toContain("sip_call_id");
  });

  it("creates an agent version draft", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents/cedco-main-agent/versions`,
      headers: adminHeaders,
      payload: {
        promptVersionId: "prompt-v1",
        flowVersionId: "flow-v1",
        knowledgeBaseVersionId: "kb-v1",
        capabilities: ["cedco-orientation"],
      },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(201);
    expect(body.data).toMatchObject({
      agentId: "cedco-main-agent",
      status: "draft",
      versionNumber: 1,
    });
  });

  it("creates a voice call draft without dispatching", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: adminHeaders,
      payload: { callId: "call-test-003", direction: "outbound", metadata: { channel: "test" } },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(201);
    expect(body.data).toMatchObject({
      callId: "call-test-003",
      status: "draft",
      dispatch: "not_started",
    });
  });

  it("registers voice events with sanitized metadata", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls/call-test-003/events`,
      headers: adminHeaders,
      payload: {
        type: "status_changed",
        metadata: { email: "redacted@example.invalid", safe: "ok" },
      },
    });
    const body = response.json<Envelope<{ metadata: Record<string, unknown> }>>();

    expect(response.statusCode).toBe(201);
    expect(body.data?.metadata).toMatchObject({ email: "[REDACTED]", safe: "ok" });
  });

  it("returns not_found for missing voice calls", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/voice/calls/missing-call`,
      headers: adminHeaders,
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(404);
    expect(body.error?.code).toBe("not_found");
  });
});
