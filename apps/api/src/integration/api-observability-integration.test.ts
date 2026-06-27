import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { metricNames } from "../../../../packages/observability/src";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const apiSourceRoot = join(repoRoot, "apps", "api", "src");
const tenantBase = "/api/v1/tenants/cedco-test";
const cedcoBase = `${tenantBase}/products/cedco/d02`;
const adminHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-api-observability-001",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-api-observability-voice",
};

let harness: ApiPrismaTestHarness;
let app: FastifyInstance;

runWhenDatabaseExists("API Prisma observability integration", () => {
  beforeAll(async () => {
    harness = await createApiPrismaTestHarness(databaseUrl as string);
    app = harness.app;
  }, 120_000);

  beforeEach(async () => {
    await harness.cleanup();
    await harness.seedBaseContext();
    harness.logger.clear();
    harness.metrics.clear();
  });

  afterAll(async () => {
    await harness.disconnect();
  });

  it("persists audit logs for agent creation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/agents`,
      headers: adminHeaders,
      payload: {
        agentId: "cedco-main-agent-test",
        name: "CEDCO Main Agent Test",
        defaultLocale: "es-CO",
      },
    });
    const audit = await waitForAudit({
      tenantId: "cedco-test",
      action: "agent.create",
    });

    expect(response.statusCode).toBe(201);
    expect(audit).toMatchObject({ result: "success", correlationId: "corr-api-observability-001" });
  });

  it("persists audit logs for voice call creation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: "call-observability-001", direction: "outbound" },
    });
    const audit = await waitForAudit({
      tenantId: "cedco-test",
      action: "voice.call.create",
    });

    expect(response.statusCode).toBe(201);
    expect(audit).toMatchObject({ result: "success" });
  });

  it("persists audit logs for CEDCO D02 configuration updates", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: {
        defaultLocale: "es-CO",
        allowedSiteIds: ["bucaramanga"],
        allowedServiceIds: ["odontologia-general-test"],
        handoffEnabled: true,
        schedulingMode: "mock",
        eligibilityMode: "mock",
        realCallsEnabled: false,
      },
    });
    const audit = await waitForAudit({
      tenantId: "cedco-test",
      action: "cedco.d02.config.update",
    });

    expect(response.statusCode).toBe(200);
    expect(audit).toMatchObject({ result: "success" });
  });

  it("does not persist sensitive payload values on validation failure", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: {
        callId: "bad-call",
        direction: "outbound",
        metadata: { phoneNumber: "blocked-phone", rawTranscript: "blocked-transcript" },
      },
    });
    const auditRows = await harness.prisma.auditLog.findMany({ where: { tenantId: "cedco-test" } });

    expect(response.statusCode).toBe(400);
    expect(JSON.stringify(auditRows)).not.toContain("blocked-phone");
    expect(JSON.stringify(auditRows)).not.toContain("blocked-transcript");
  });

  it("keeps sensitive values out of in-memory logs", async () => {
    await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: {
        callId: "bad-call",
        direction: "outbound",
        metadata: { audioUrl: "blocked-audio", rawTranscript: "blocked-transcript" },
      },
    });

    const logs = JSON.stringify(harness.logger.getEntries());
    expect(logs).not.toContain("blocked-audio");
    expect(logs).not.toContain("blocked-transcript");
  });

  it("records request counters and duration metrics", async () => {
    await app.inject({ method: "GET", url: `${cedcoBase}/configuration`, headers: adminHeaders });
    const snapshot = harness.metrics.snapshot();

    expect(
      snapshot.counters.some((counter) => counter.name === metricNames.httpRequestsTotal),
    ).toBe(true);
    expect(
      snapshot.observations.some(
        (observation) => observation.name === metricNames.httpRequestDurationMs,
      ),
    ).toBe(true);
  });

  it("audits cross-tenant denied lookup as failure", async () => {
    await harness.prisma.callSession.create({
      data: {
        id: "call-other-tenant-obs",
        tenantId: "other-tenant",
        direction: "outbound",
        status: "draft",
        correlationId: "corr-other",
        metadata: {},
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/voice/calls/call-other-tenant-obs`,
      headers: adminHeaders,
    });
    const audit = await waitForAudit({
      tenantId: "cedco-test",
      action: "api.not_found",
    });

    expect(response.statusCode).toBe(404);
    expect(audit).toMatchObject({ result: "failure" });
  });

  it("does not start server listeners in integration code", () => {
    const content = listFiles(join(apiSourceRoot, "integration"))
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toMatch(/\.listen\s*\(/u);
  });

  it("does not import real providers in API source", () => {
    const content = listFiles(apiSourceRoot)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toMatch(
      /from\s+["'](?:elevenlabs|openai|anthropic|twilio|telnyx|plivo|vonage)/iu,
    );
  });

  it("does not use an external database URL in tests", () => {
    expect(databaseUrl).toContain("hyperion_test");
    expect(databaseUrl).toContain("localhost");
  });
});

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

async function waitForAudit(input: { readonly tenantId: string; readonly action: string }) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const audit = await harness.prisma.auditLog.findFirst({
      where: { tenantId: input.tenantId, action: input.action },
    });
    if (audit) {
      return audit;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return null;
}
