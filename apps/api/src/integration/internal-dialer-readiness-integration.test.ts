import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const baseUrl = "/api/v1/tenants/cedco-test/integrations/internal-dialer";
const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-dialer-readiness-integration-001",
};
const safeDryRunPayload = {
  idempotency_key: "hyperion-key-integration-001",
  safe_contact_ref: "safe-contact-ref-integration",
  agent_alias: "cedco-agent-alias",
  caller_alias: "cedco-caller-alias",
  consent: { granted: true },
  consent_ref: "consent-ref-integration",
};

let harness: ApiPrismaTestHarness;

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
}

runWhenDatabaseExists("internal dialer readiness Prisma integration", () => {
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

  it("readiness returns blocked P0 status", async () => {
    const response = await harness.app.inject({
      method: "GET",
      url: `${baseUrl}/readiness`,
      headers,
    });
    const body = response.json<Envelope<{ hardeningStatus: { p0Complete: boolean } }>>();
    expect(response.statusCode).toBe(200);
    expect(body.data?.hardeningStatus.p0Complete).toBe(false);
  });

  it("dry-run safe request passes without persistence or provider egress", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: safeDryRunPayload,
    });
    const body =
      response.json<
        Envelope<{ status: string; idempotency_key: string; provider_egress: boolean }>
      >();
    const persistedCalls = await harness.prisma.callSession.findMany();
    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.idempotency_key).toBe("hyperion-key-integration-001");
    expect(body.data?.provider_egress).toBe(false);
    expect(persistedCalls).toHaveLength(0);
  });

  it.each([
    { phoneNumber: "+15555550123" },
    { metadata: { agent_id: "agent_1234567890123456" } },
    { metadata: { phone_number_id: "phone_1234567890123456" } },
    { callback_alias: "https://example.invalid/callback" },
    { runtimeMode: "future_live" },
  ])("blocks unsafe dry-run payload %j", async (patch) => {
    const response = await harness.app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: { ...safeDryRunPayload, ...patch },
    });
    expect([200, 400, 403]).toContain(response.statusCode);
    expect(response.body).not.toMatch(
      /\+15555550123|agent_1234567890123456|phone_1234567890123456/iu,
    );
    if (response.statusCode === 200) {
      expect(response.json<Envelope<{ status: string }>>().data?.status).toBe("blocked");
    }
  });
});
