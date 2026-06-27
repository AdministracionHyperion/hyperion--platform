import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  cedcoD02MockFlowFixture,
  cedcoD02MockHeaders,
  mockProviderEventFixture,
  mockProviderEventHeaders,
  unsafeProviderEventPayloads,
} from "../../../../packages/testing/src";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly meta: { readonly correlationId: string };
}

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const url = "/api/v1/tenants/cedco-test/voice/mock-provider-events";

let harness: ApiPrismaTestHarness;

runWhenDatabaseExists("mock provider event ingestion Prisma integration", () => {
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

  it("persists sanitized provider event and post-call result", async () => {
    const response = await postProviderEvent("provider-event-integration-persist");
    const body = response.json<Envelope>();
    const providerEvents = await harness.prisma.providerCallEvent.findMany({
      where: { tenantId: "cedco-test", providerEventId: String(body.data?.eventId) },
    });
    const postCall = await harness.prisma.postCallResult.findFirst({
      where: { tenantId: "cedco-test", callId: "mock-session-provider-event-001" },
    });

    expect(response.statusCode).toBe(202);
    expect(providerEvents).toHaveLength(1);
    expect(postCall?.redactedSummary).toContain("Synthetic");
  });

  it("persists audit event", async () => {
    await postProviderEvent("provider-event-integration-audit");
    const audits = await harness.prisma.auditLog.findMany({
      where: { tenantId: "cedco-test", correlationId: "corr-provider-event-001" },
    });
    expect(audits.some((audit) => audit.action === "provider.event.processed")).toBe(true);
  });

  it("blocks replay", async () => {
    const first = await postProviderEvent("provider-event-integration-replay");
    const second = await postProviderEvent("provider-event-integration-replay");
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(409);
  });

  it("does not persist raw transcript, phone, audio URL, or token", async () => {
    await postProviderEvent("provider-event-integration-safe-persistence");
    const rows = await Promise.all([
      harness.prisma.providerCallEvent.findMany(),
      harness.prisma.postCallResult.findMany(),
      harness.prisma.auditLog.findMany(),
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/rawTranscript|phoneNumber|audioUrl|token|\+57/iu);
  });

  it("rejects unsafe payload and does not persist it", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: "provider-event-unsafe-integration",
        ...unsafeProviderEventPayloads.rawTranscript,
      },
    });
    const serialized = JSON.stringify(await harness.prisma.providerCallEvent.findMany());
    expect(response.statusCode).toBe(400);
    expect(serialized).not.toContain("blocked transcript");
  });

  it("keeps mock call runtime endpoint working", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: "/api/v1/tenants/cedco-test/products/cedco/d02/mock-call-flows",
      headers: cedcoD02MockHeaders,
      payload: cedcoD02MockFlowFixture,
    });
    expect(response.statusCode).toBe(201);
  });

  it("keeps CEDCO configuration and voice draft working", async () => {
    const configuration = await harness.app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/products/cedco/d02/configuration",
      headers: cedcoD02MockHeaders,
    });
    const voiceDraft = await harness.app.inject({
      method: "POST",
      url: "/api/v1/tenants/cedco-test/voice/calls",
      headers: { ...cedcoD02MockHeaders, "x-actor-roles": "voice-operator" },
      payload: { callId: "call-provider-event-regression", direction: "outbound" },
    });

    expect(configuration.statusCode).toBe(200);
    expect(voiceDraft.statusCode).toBe(201);
  });
});

function postProviderEvent(eventId: string) {
  return harness.app.inject({
    method: "POST",
    url,
    headers: mockProviderEventHeaders,
    payload: { ...mockProviderEventFixture, eventId },
  });
}
