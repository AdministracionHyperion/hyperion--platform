import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createRateLimitRule } from "../../../../modules/core/rate-limits/src";
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
  "x-correlation-id": "corr-api-security-gates",
};
const voiceHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-api-security-voice",
};

let harness: ApiPrismaTestHarness;
let app: FastifyInstance;

runWhenDatabaseExists("API security gates integration", () => {
  beforeAll(async () => {
    harness = await createApiPrismaTestHarness(databaseUrl as string);
    app = harness.app;
  }, 120_000);

  beforeEach(async () => {
    await harness.cleanup();
    await harness.seedBaseContext();
    harness.logger.clear();
    harness.metrics.clear();
    harness.services.security?.rateLimitStore.clear();
  });

  afterAll(async () => {
    await harness.disconnect();
  });

  it("persists audit failure for policy denied", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: cedcoConfig({ realCallsEnabled: true }),
    });
    const audit = await harness.prisma.auditLog.findFirst({
      where: { tenantId: "cedco-test", action: "policy.gate.denied" },
    });

    expect(response.statusCode).toBe(403);
    expect(audit).toMatchObject({ result: "failure", resourceId: "cedco.d02.real_calls.enable" });
  });

  it("records rate limit denied metrics and logs", async () => {
    harness.services.security?.setRateLimitRuleForTests?.(
      createRateLimitRule({
        ruleId: "integration-low-limit",
        scope: "tenant_actor",
        limit: 1,
        windowMs: 60_000,
      }),
    );

    await app.inject({ method: "GET", url: `${tenantBase}/context`, headers: adminHeaders });
    const response = await app.inject({
      method: "GET",
      url: `${tenantBase}/context`,
      headers: adminHeaders,
    });

    expect(response.statusCode).toBe(429);
    expect(
      harness.metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.rateLimitDeniedTotal),
    ).toBe(true);
    expect(
      harness.logger.getEntries().some((entry) => entry.eventName === "rate_limit.denied"),
    ).toBe(true);
  });

  it("does not persist CEDCO realCallsEnabled true", async () => {
    const response = await app.inject({
      method: "PUT",
      url: `${cedcoBase}/configuration`,
      headers: adminHeaders,
      payload: cedcoConfig({ realCallsEnabled: true }),
    });
    const row = await harness.prisma.cedcoD02Configuration.findUnique({
      where: { tenantId: "cedco-test" },
    });

    expect(response.statusCode).toBe(403);
    expect(row).toBeNull();
  });

  it.each(["rawTranscript", "phoneNumber"] as const)("does not persist %s", async (field) => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: {
        callId: `call-blocked-${field.toLowerCase()}`,
        direction: "outbound",
        metadata: { [field]: "blocked-value" },
      },
    });
    const persisted = await harness.prisma.callSession.findFirst({
      where: { id: `call-blocked-${field.toLowerCase()}` },
    });
    const auditRows = await harness.prisma.auditLog.findMany({ where: { tenantId: "cedco-test" } });

    expect(response.statusCode).toBe(400);
    expect(persisted).toBeNull();
    expect(JSON.stringify(auditRows)).not.toContain("blocked-value");
  });

  it("normal agent creation still works", async () => {
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
    const row = await harness.prisma.agent.findFirst({
      where: { tenantId: "cedco-test", id: "cedco-main-agent-test" },
    });

    expect(response.statusCode).toBe(201);
    expect(row).toMatchObject({ name: "CEDCO Main Agent Test" });
  });

  it("normal voice call draft still works", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${tenantBase}/voice/calls`,
      headers: voiceHeaders,
      payload: { callId: "call-security-gates-draft", direction: "outbound" },
    });
    const row = await harness.prisma.callSession.findFirst({
      where: { tenantId: "cedco-test", id: "call-security-gates-draft" },
    });

    expect(response.statusCode).toBe(201);
    expect(row).toMatchObject({ status: "draft" });
  });

  it("does not import providers, create R03, or start listeners", () => {
    const content = listFiles(apiSourceRoot)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    const testContent = [
      ...listFiles(join(apiSourceRoot, "integration")),
      ...listFiles(join(apiSourceRoot, "tests")),
    ]
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toMatch(
      /from\s+["'](?:elevenlabs|openai|anthropic|twilio|telnyx|plivo|vonage)/iu,
    );
    expect(testContent).not.toMatch(/\.listen\s*\(/u);
    expect(existsSync(join(repoRoot, "modules", "products", "cedco", "r03"))).toBe(false);
  });
});

function cedcoConfig(overrides: Record<string, unknown> = {}) {
  return {
    defaultLocale: "es-CO",
    allowedSiteIds: ["bucaramanga"],
    allowedServiceIds: ["odontologia-general-test"],
    handoffEnabled: true,
    schedulingMode: "mock",
    eligibilityMode: "mock",
    realCallsEnabled: false,
    ...overrides,
  };
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
