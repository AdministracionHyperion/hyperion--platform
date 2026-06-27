import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

const tenantBase = "/api/v1/tenants/cedco-test";
const cedcoBase = `${tenantBase}/products/cedco/d02`;
const adminHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-policy-test",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-policy-voice",
};

beforeEach(async () => {
  services = createFakeApiServices();
  app = await createApiApp({ services });
});

afterEach(async () => {
  await app.close();
});

describe("API policy gates and runtime blockers", () => {
  it("allows normal protected requests with valid headers", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });

    expect(response.statusCode).toBe(200);
  });

  it.each([
    ["providerEgressEnabled", true],
    ["productionDeployEnabled", true],
    ["rawTranscriptEnabled", true],
    ["rawRecordingEnabled", true],
    ["dataExportEnabled", true],
  ] as const)("blocks runtime flag %s", async (field, value) => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: `call-${field.toLowerCase()}`, direction: "outbound", [field]: value },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(403);
    expect(body.error?.code).toBe("policy_blocked");
  });

  it.each(["rawTranscript", "audioUrl", "token", "secret", "password"] as const)(
    "blocks dangerous payload field %s",
    async (field) => {
      const response = await app.inject({
        method: "POST",
        url: `${tenantBase}/voice/calls`,
        headers: voiceHeaders,
        payload: {
          callId: `call-${field.toLowerCase()}`,
          direction: "outbound",
          metadata: { [field]: "blocked-value" },
        },
      });
      const body = response.json<Envelope>();

      expect(response.statusCode).toBe(400);
      expect(body.error?.code).toBe("validation_error");
      expect(JSON.stringify(body)).not.toContain("blocked-value");
    },
  );

  it("blocks CEDCO realCallsEnabled true", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: baseCedcoConfig({ realCallsEnabled: true }),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<Envelope>().error?.code).toBe("policy_blocked");
  });

  it("blocks scheduling integration mode in CEDCO config", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: baseCedcoConfig({ schedulingMode: "integration" }),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<Envelope>().error?.code).toBe("policy_blocked");
  });

  it("blocks eligibility integration mode in CEDCO config", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: baseCedcoConfig({ eligibilityMode: "integration" }),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<Envelope>().error?.code).toBe("policy_blocked");
  });

  it("voice call creation remains draft and never dispatches", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: "call-policy-draft", direction: "outbound" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json<{ data: { dispatch: string } }>().data.dispatch).toBe("not_started");
  });

  it("unknown dispatch route never calls a provider", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls/call-policy-draft/dispatch`,
      headers: voiceHeaders,
    });

    expect([403, 404]).toContain(response.statusCode);
  });

  it("records runtime blocked metrics, audit and sanitized logs", async () => {
    await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: baseCedcoConfig({ realCallsEnabled: true }),
    });

    const counters = services.observability?.metrics.snapshot().counters ?? [];
    const audits = services.observability?.getAuditEvents?.() ?? [];
    const logs = JSON.stringify(services.observability?.getLogEntries?.() ?? []);

    expect(
      counters.some((counter) => counter.name === metricNames.runtimeBlockedRequestsTotal),
    ).toBe(true);
    expect(audits.some((audit) => audit.action === "policy.gate.denied")).toBe(true);
    expect(logs).not.toContain("blocked-value");
  });

  it("preserves correlationId on policy errors", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: baseCedcoConfig({ realCallsEnabled: true }),
    });

    expect(response.json<Envelope>().meta.correlationId).toBe("corr-policy-test");
  });
});

function baseCedcoConfig(overrides: Record<string, unknown> = {}) {
  return {
    defaultLocale: "es-CO",
    allowedSiteIds: ["bucaramanga"],
    allowedServiceIds: [],
    handoffEnabled: true,
    schedulingMode: "mock",
    eligibilityMode: "mock",
    realCallsEnabled: false,
    ...overrides,
  };
}
