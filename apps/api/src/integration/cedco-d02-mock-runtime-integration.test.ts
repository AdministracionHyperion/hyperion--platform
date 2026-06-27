import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cedcoD02MockFlowFixture, cedcoD02MockHeaders } from "../../../../packages/testing/src";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly meta: { readonly correlationId: string };
}

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const url = "/api/v1/tenants/cedco-test/products/cedco/d02/mock-call-flows";

let harness: ApiPrismaTestHarness;

runWhenDatabaseExists("CEDCO D02 mock runtime Prisma integration", () => {
  beforeAll(async () => {
    harness = await createApiPrismaTestHarness(databaseUrl as string);
  }, 120_000);

  beforeEach(async () => {
    await harness.cleanup();
    await harness.seedBaseContext();
  });

  afterAll(async () => {
    await harness.disconnect();
  });

  it("executes endpoint and persists safe call state", async () => {
    const response = await postMockFlow();
    const body = response.json<Envelope>();
    const sessionId = String(body.data?.sessionId);
    const session = await harness.prisma.callSession.findUnique({ where: { id: sessionId } });
    const events = await harness.prisma.callEvent.findMany({ where: { callId: sessionId } });
    const postCall = await harness.prisma.postCallResult.findFirst({
      where: { callId: sessionId },
    });

    expect(response.statusCode).toBe(201);
    expect(session).toMatchObject({ status: "completed", tenantId: "cedco-test" });
    expect(events).toHaveLength(4);
    expect(postCall?.redactedSummary).toContain("mock");
  });

  it("persists audit events", async () => {
    await postMockFlow();
    const audits = await harness.prisma.auditLog.findMany({
      where: { tenantId: "cedco-test", correlationId: "corr-cedco-mock-api-001" },
    });
    expect(audits.some((audit) => audit.action === "cedco.d02.mock_flow.completed")).toBe(true);
  });

  it("increments metrics and persists CEDCO metric", async () => {
    await postMockFlow();
    const metrics = await harness.prisma.cedcoD02Metric.findMany({
      where: { tenantId: "cedco-test", key: "cedco_d02.mock_flow.completed" },
    });
    expect(metrics).toHaveLength(1);
    expect(harness.metrics.snapshot().counters.length).toBeGreaterThan(0);
  });

  it("does not persist PII or raw media", async () => {
    await postMockFlow();
    const rows = await Promise.all([
      harness.prisma.callSession.findMany(),
      harness.prisma.callEvent.findMany(),
      harness.prisma.providerCallEvent.findMany(),
      harness.prisma.postCallResult.findMany(),
    ]);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toMatch(/phoneNumber|to_number|rawTranscript|audioUrl|\+57/iu);
  });

  it("keeps normal CEDCO configuration working", async () => {
    const response = await harness.app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/products/cedco/d02/configuration",
      headers: cedcoD02MockHeaders,
    });
    expect(response.statusCode).toBe(200);
  });

  it("keeps normal voice draft creation working", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/tenants/cedco-test/voice/calls",
      headers: { ...cedcoD02MockHeaders, "x-actor-roles": "voice-operator" },
      payload: { callId: "call-mock-runtime-normal", direction: "outbound" },
    });
    expect(response.statusCode).toBe(201);
  });
});

function postMockFlow() {
  return harness.app.inject({
    method: "POST",
    url,
    headers: cedcoD02MockHeaders,
    payload: cedcoD02MockFlowFixture,
  });
}
