import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  cedcoD02MockFlowFixture,
  cedcoD02MockHeaders,
  mockProviderEventFixture,
  mockProviderEventHeaders,
} from "../../../../packages/testing/src";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const dashboardUrl = "/api/v1/tenants/cedco-test/operations/dashboard";
let harness: ApiPrismaTestHarness;
let seedCounter = 0;

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
}

runWhenDatabaseExists("operations dashboard Prisma integration", () => {
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

  it("builds dashboard summary with persisted mock data", async () => {
    await seedMockOperationalData();
    const response = await getDashboard();
    const body = response.json<Envelope>();
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(body.data)).toContain("mock_call_");
  });

  it("shows sanitized mock call flow when fixture exists", async () => {
    await seedMockOperationalData();
    const body = (await getDashboard()).json<Envelope>();
    expect(JSON.stringify(body.data?.mockCallFlows)).toContain("mock-session-");
    expect(JSON.stringify(body.data?.mockCallFlows)).not.toMatch(/phoneNumber|rawTranscript/iu);
  });

  it("shows sanitized provider event when fixture exists", async () => {
    await seedMockOperationalData();
    const body = (await getDashboard()).json<Envelope>();
    expect(JSON.stringify(body.data?.providerEvents)).toContain("provider.mock");
    expect(JSON.stringify(body.data?.providerEvents)).not.toMatch(/rawPayload|audioUrl/iu);
  });

  it("audit preview does not expose dangerous metadata", async () => {
    await seedMockOperationalData();
    const body = (await getDashboard()).json<Envelope>();
    expect(JSON.stringify(body.data?.auditPreview)).not.toMatch(
      /rawTranscript|token|phoneNumber/iu,
    );
  });

  it("eval summary appears", async () => {
    const body = (await getDashboard()).json<Envelope>();
    expect(JSON.stringify(body.data?.evalSummary)).toContain("pass");
  });

  it("does not persist or expose PII", async () => {
    await seedMockOperationalData();
    const allRows = await Promise.all([
      harness.prisma.callSession.findMany(),
      harness.prisma.providerCallEvent.findMany(),
      harness.prisma.auditLog.findMany(),
    ]);
    const response = await getDashboard();
    expect(JSON.stringify(allRows)).not.toMatch(/phoneNumber|rawTranscript|audioUrl|\+57/iu);
    expect(response.body).not.toMatch(/phoneNumber|rawTranscript|audioUrl|\+57/iu);
  });
});

async function seedMockOperationalData() {
  seedCounter += 1;
  const suffix = seedCounter.toString().padStart(3, "0");
  await harness.app.inject({
    method: "POST",
    url: "/api/v1/tenants/cedco-test/products/cedco/d02/mock-call-flows",
    headers: { ...cedcoD02MockHeaders, "x-correlation-id": `corr-dashboard-flow-${suffix}` },
    payload: cedcoD02MockFlowFixture,
  });
  await harness.app.inject({
    method: "POST",
    url: "/api/v1/tenants/cedco-test/voice/mock-provider-events",
    headers: {
      ...mockProviderEventHeaders,
      "x-correlation-id": `corr-dashboard-provider-${suffix}`,
    },
    payload: {
      ...mockProviderEventFixture,
      eventId: `provider-event-dashboard-${suffix}`,
      providerCallRef: `mock_call_dashboard_${suffix}`,
      metadata: {
        ...mockProviderEventFixture.metadata,
        safeCallSessionRef: `mock-session-dashboard-${suffix}`,
      },
    },
  });
}

function getDashboard() {
  return harness.app.inject({
    method: "GET",
    url: dashboardUrl,
    headers: { ...cedcoD02MockHeaders, "x-correlation-id": "corr-dashboard-integration-001" },
  });
}
