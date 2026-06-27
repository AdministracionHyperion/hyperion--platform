import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
}

let app: FastifyInstance;

const tenantBase = "/api/v1/tenants/cedco-test/products/cedco/d02";
const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-test-cedco",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-test-voice",
};

beforeEach(async () => {
  app = await createApiApp({ services: createFakeApiServices() });
});

afterEach(async () => {
  await app.close();
});

describe("CEDCO D02 API contracts", () => {
  it("returns configuration with realCallsEnabled false", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/configuration`,
      headers,
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({ defaultLocale: "es-CO", realCallsEnabled: false });
  });

  it("rejects enabling real calls in the skeleton API", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${tenantBase}/configuration`,
      headers,
      payload: {
        defaultLocale: "es-CO",
        allowedSiteIds: ["bucaramanga"],
        allowedServiceIds: [],
        handoffEnabled: true,
        schedulingMode: "mock",
        eligibilityMode: "mock",
        realCallsEnabled: true,
      },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(400);
    expect(body.error?.code).toBe("validation_error");
  });

  it("classifies scheduling intent deterministically", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/intents/classify`,
      headers: voiceHeaders,
      payload: { text: "quiero agendar una cita" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({ intent: "agendar" });
  });

  it("classifies human request intent deterministically", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/intents/classify`,
      headers: voiceHeaders,
      payload: { text: "necesito hablar con un asesor humano" },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({ intent: "solicitar_humano" });
  });

  it("readiness evaluation blocks when agent version is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/readiness/evaluate`,
      headers,
      payload: {
        configuration: {
          defaultLocale: "es-CO",
          allowedSiteIds: ["bucaramanga"],
          allowedServiceIds: [],
          handoffEnabled: true,
          schedulingMode: "mock",
          eligibilityMode: "mock",
          realCallsEnabled: false,
        },
        objective: "faq",
      },
    });
    const body = response.json<Envelope<{ blockingReasons: string[] }>>();

    expect(response.statusCode).toBe(200);
    expect(body.data?.blockingReasons).toContain("missing_agent_version");
  });

  it("compliance evaluation blocks diagnosis", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/compliance/evaluate`,
      headers: voiceHeaders,
      payload: { text: "puede hacer un diagnostico medico" },
    });
    const body = response.json<Envelope<{ blocked: boolean; reasons: string[] }>>();

    expect(response.statusCode).toBe(200);
    expect(body.data?.blocked).toBe(true);
    expect(body.data?.reasons).toContain("no_diagnosis");
  });

  it("compliance evaluation blocks clinical triage", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/compliance/evaluate`,
      headers: voiceHeaders,
      payload: { text: "necesito triage clinico ahora" },
    });
    const body = response.json<Envelope<{ blocked: boolean; reasons: string[] }>>();

    expect(response.statusCode).toBe(200);
    expect(body.data?.blocked).toBe(true);
    expect(body.data?.reasons).toContain("no_clinical_triage");
  });

  it("handoff evaluation recommends handoff for urgent cases", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/handoff/evaluate`,
      headers: voiceHeaders,
      payload: { intent: "urgencia", confidence: 0.9 },
    });
    const body = response.json<Envelope<{ shouldHandoff: boolean; reason: string }>>();

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({ shouldHandoff: true, reason: "urgent_case" });
  });

  it("scheduling request never creates a real appointment", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/scheduling/requests`,
      headers: voiceHeaders,
      payload: {
        patientContextRef: "cedco-context-ref-001",
        serviceId: "odontologia-general-test",
        siteId: "bucaramanga",
        mode: "mock",
      },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(201);
    expect(body.data).toMatchObject({ status: "mock_confirmed", realAppointmentCreated: false });
  });

  it("eligibility check never validates real rights", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/eligibility/checks`,
      headers: voiceHeaders,
      payload: {
        patientContextRef: "cedco-context-ref-001",
        agreementId: "convenio-test",
        serviceId: "odontologia-general-test",
        mode: "integration_required",
      },
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(201);
    expect(body.data).toMatchObject({
      status: "integration_required",
      realEligibilityChecked: false,
    });
  });

  it("returns an empty safe metrics summary", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/metrics/summary`,
      headers,
    });
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({ total: 0, source: "empty-fake-summary" });
  });
});
