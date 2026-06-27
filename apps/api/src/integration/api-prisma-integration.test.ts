import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
  readonly meta: { readonly correlationId: string; readonly tenantId?: string };
}

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const apiSourceRoot = join(repoRoot, "apps", "api", "src");
const tenantBase = "/api/v1/tenants/cedco-test";
const cedcoBase = `${tenantBase}/products/cedco/d02`;
const adminHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-api-test-001",
};
const viewerHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-viewer",
  "x-correlation-id": "corr-api-test-viewer",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-api-test-voice",
};

let harness: ApiPrismaTestHarness;
let app: FastifyInstance;

runWhenDatabaseExists("API Prisma integration", () => {
  beforeAll(async () => {
    harness = await createApiPrismaTestHarness(databaseUrl as string);
    app = harness.app;
  }, 120_000);

  beforeEach(async () => {
    await harness.cleanup();
    await harness.seedBaseContext();
  });

  afterAll(async () => {
    await harness.disconnect();
  });

  it("serves health without database-dependent context", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ service: "hyperion-api" });
  });

  it("serves version", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/version" });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ commit: "unknown" });
  });

  it("returns tenant request context with valid headers", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });
    const body = response.json<Envelope>();
    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({ tenantId: "cedco-test", actorId: "actor-test" });
    expect(body.meta.correlationId).toBe("corr-api-test-001");
  });

  it("rejects missing actor id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-roles": "tenant-admin" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("rejects missing actor roles", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: { "x-actor-id": "actor-test" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("rejects invalid tenant id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/CEDCO/context",
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(400);
  });

  it("preserves incoming correlation id", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });
    expect(response.json<Envelope>().meta.correlationId).toBe("corr-api-test-001");
  });

  it("returns false for a missing feature flag", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/features/cedco-feature-test`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ enabled: false });
  });

  it("reads tenant-scoped feature flags from Prisma", async () => {
    await harness.prisma.featureFlag.create({
      data: {
        id: "flag-cedco-feature-test",
        tenantId: "cedco-test",
        flagKey: "cedco-feature-test",
        enabled: true,
        description: "Synthetic feature flag",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/features/cedco-feature-test`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ enabled: true, source: "prisma" });
  });

  it("persists agents", async () => {
    const response = await createAgent();
    const row = await harness.prisma.agent.findFirst({
      where: { tenantId: "cedco-test", id: "cedco-main-agent-test" },
    });

    expect(response.statusCode).toBe(201);
    expect(row?.name).toBe("CEDCO Main Agent Test");
  });

  it("denies tenant viewer agent creation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents`,
      headers: viewerHeaders,
      payload: { agentId: "viewer-denied-agent", name: "Denied", defaultLocale: "es-CO" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("persists agent version drafts", async () => {
    await createAgent();
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents/cedco-main-agent-test/versions`,
      headers: adminHeaders,
      payload: {
        promptVersionId: "prompt-version-test",
        flowVersionId: "flow-version-test",
        knowledgeBaseVersionId: "kb-version-test",
        capabilities: ["cedco-orientation"],
      },
    });
    const row = await harness.prisma.agentVersion.findFirst({
      where: { tenantId: "cedco-test", agentId: "cedco-main-agent-test" },
    });

    expect(response.statusCode).toBe(201);
    expect(row).toMatchObject({ status: "draft", versionNumber: 1 });
  });

  it("persists voice call sessions", async () => {
    const response = await createVoiceCall();
    const row = await harness.prisma.callSession.findFirst({
      where: { tenantId: "cedco-test", id: "call-cedco-test-001" },
    });

    expect(response.statusCode).toBe(201);
    expect(row).toMatchObject({ status: "draft", correlationId: "corr-api-test-voice" });
  });

  it("reads persisted voice call sessions", async () => {
    await createVoiceCall();
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/voice/calls/call-cedco-test-001`,
      headers: adminHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ callId: "call-cedco-test-001" });
  });

  it("returns 404 for missing call sessions", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/voice/calls/missing-call`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(404);
  });

  it("persists voice call events with sanitized metadata", async () => {
    await createVoiceCall();
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls/call-cedco-test-001/events`,
      headers: voiceHeaders,
      payload: {
        type: "call_status_changed",
        metadata: { email: "synthetic@example.invalid", safe: "ok" },
      },
    });
    const row = await harness.prisma.callEvent.findFirst({
      where: { tenantId: "cedco-test", callId: "call-cedco-test-001" },
    });

    expect(response.statusCode).toBe(201);
    expect(row?.metadata).toMatchObject({ email: "[REDACTED]", safe: "ok" });
  });

  it.each(["phoneNumber", "rawTranscript", "audioUrl"])(
    "rejects forbidden payload field %s",
    async (field) => {
      const response = await app.inject({
        method: "POST",
        url: `${tenantBase}/voice/calls`,
        headers: voiceHeaders,
        payload: { callId: "bad-call", direction: "outbound", metadata: { [field]: "blocked" } },
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it("returns default safe CEDCO D02 configuration", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ realCallsEnabled: false });
  });

  it("persists CEDCO D02 configuration with real calls disabled", async () => {
    const response = await putCedcoConfiguration(false);
    const row = await harness.prisma.cedcoD02Configuration.findUnique({
      where: { tenantId: "cedco-test" },
    });

    expect(response.statusCode).toBe(200);
    expect(row).toMatchObject({ defaultLocale: "es-CO", realCallsEnabled: false });
  });

  it("rejects CEDCO D02 configuration with real calls enabled", async () => {
    const response = await putCedcoConfiguration(true);
    expect(response.statusCode).toBe(400);
  });

  it("classifies scheduling intent", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${cedcoBase}/intents/classify`,
      headers: voiceHeaders,
      payload: { text: "quiero agendar una cita" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ intent: "agendar" });
  });

  it("blocks diagnosis in compliance evaluation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${cedcoBase}/compliance/evaluate`,
      headers: voiceHeaders,
      payload: { text: "necesito un diagnostico medico" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope<{ blocked: boolean }>>().data?.blocked).toBe(true);
  });

  it("recommends handoff for urgent cases", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${cedcoBase}/handoff/evaluate`,
      headers: voiceHeaders,
      payload: { intent: "urgencia", confidence: 0.9 },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ shouldHandoff: true });
  });

  it("persists mock scheduling requests without real appointments", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${cedcoBase}/scheduling/requests`,
      headers: voiceHeaders,
      payload: {
        patientContextRef: "cedco-context-ref-001",
        serviceId: "odontologia-general-test",
        siteId: "bucaramanga",
        mode: "mock",
      },
    });
    const row = await harness.prisma.cedcoSchedulingRequest.findFirst({
      where: { tenantId: "cedco-test" },
    });

    expect(response.statusCode).toBe(201);
    expect(row).toMatchObject({ status: "mock_confirmed", mode: "mock" });
    expect(response.json<Envelope>().data).toMatchObject({ realAppointmentCreated: false });
  });

  it("persists eligibility checks without real rights validation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${cedcoBase}/eligibility/checks`,
      headers: voiceHeaders,
      payload: {
        patientContextRef: "cedco-context-ref-001",
        agreementId: "convenio-test",
        serviceId: "odontologia-general-test",
        mode: "integration_required",
      },
    });
    const row = await harness.prisma.cedcoEligibilityCheck.findFirst({
      where: { tenantId: "cedco-test" },
    });

    expect(response.statusCode).toBe(201);
    expect(row).toMatchObject({ status: "integration_required" });
    expect(response.json<Envelope>().data).toMatchObject({ realEligibilityChecked: false });
  });

  it("returns safe CEDCO metrics summary", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${cedcoBase}/metrics/summary`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Envelope>().data).toMatchObject({ total: 0 });
  });

  it("does not expose cross-tenant call sessions", async () => {
    await harness.prisma.callSession.create({
      data: {
        id: "call-other-tenant-001",
        tenantId: "other-tenant",
        direction: "outbound",
        status: "draft",
        correlationId: "corr-other-tenant",
        metadata: {},
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/voice/calls/call-other-tenant-001`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(404);
  });

  it("does not start server listeners in API integration tests", () => {
    const text = readFileSync(fileURLToPath(import.meta.url), "utf8");
    expect(text).not.toMatch(/\.listen\s*\(/u);
  });

  it("does not import real providers in API integration code", () => {
    const content = listFiles(apiSourceRoot)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toMatch(
      /from\s+["'](?:elevenlabs|openai|anthropic|twilio|telnyx|plivo|vonage)/iu,
    );
  });

  it("does not create R03 or fixed-assets product paths", () => {
    expect(existsSync(join(repoRoot, "modules", "products", "cedco", "r03"))).toBe(false);
    expect(existsSync(join(repoRoot, "modules", "products", "cedco", "assets"))).toBe(false);
    expect(existsSync(join(repoRoot, "modules", "products", "cedco", "activos-fijos"))).toBe(false);
  });
});

async function createAgent() {
  return app.inject({
    method: "POST",
    url: `${tenantBase}/agents`,
    headers: adminHeaders,
    payload: {
      agentId: "cedco-main-agent-test",
      name: "CEDCO Main Agent Test",
      defaultLocale: "es-CO",
    },
  });
}

async function createVoiceCall() {
  return app.inject({
    method: "POST",
    url: `${tenantBase}/voice/calls`,
    headers: voiceHeaders,
    payload: { callId: "call-cedco-test-001", direction: "outbound" },
  });
}

async function putCedcoConfiguration(realCallsEnabled: boolean) {
  return app.inject({
    method: "PUT",
    url: `${cedcoBase}/configuration`,
    headers: adminHeaders,
    payload: {
      defaultLocale: "es-CO",
      activeAgentVersionId: "agent-version-test",
      activeKnowledgeBaseVersionId: "knowledge-version-test",
      allowedSiteIds: ["bucaramanga"],
      allowedServiceIds: ["odontologia-general-test"],
      handoffEnabled: true,
      schedulingMode: "mock",
      eligibilityMode: "mock",
      realCallsEnabled,
    },
  });
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root).flatMap((entry) => {
    const fullPath = join(root, entry);
    const stat = statSync(fullPath);
    return stat.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}
