import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly meta: { readonly correlationId: string };
}

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const url = "/api/v1/tenants/cedco-test/products/cedco/d02/dialer/dry-run";

const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-cedco-d02-dialer-integration-001",
};

const safePayload = {
  idempotency_key: "hyperion-key-d02-integration-001",
  safe_contact_ref: "safe-contact-ref-d02-integration",
  patient_context_ref: "patient-context-ref-d02-integration",
  cedco_site_id: "site-ref-d02-integration",
  service_id: "service-ref-d02-integration",
  agreement_id: "agreement-ref-d02-integration",
  call_purpose: "orientation",
  objective: "orientation",
  consent: { granted: true },
  consent_ref: "consent-ref-d02-integration",
  dynamic_vars: { purpose: "orientation" },
  metadata: { source: "integration-test" },
} as const;

let harness: ApiPrismaTestHarness;

runWhenDatabaseExists("CEDCO D02 dialer dry-run Prisma integration", () => {
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

  it("executes controlled dry-run and persists safe audit only", async () => {
    const response = await harness.app.inject({
      method: "POST",
      url,
      headers,
      payload: safePayload,
    });
    const body = response.json<
      Envelope<{
        status: string;
        provider_egress: boolean;
        would_call_provider: boolean;
        safe_contact_ref: string;
      }>
    >();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.provider_egress).toBe(false);
    expect(body.data?.would_call_provider).toBe(false);
    expect(body.data?.safe_contact_ref).toBe("safe-contact-ref-d02-integration");

    const sessions = await harness.prisma.callSession.findMany({
      where: { tenantId: "cedco-test" },
    });
    const audits = await harness.prisma.auditLog.findMany({
      where: {
        tenantId: "cedco-test",
        correlationId: "corr-cedco-d02-dialer-integration-001",
      },
    });

    expect(sessions).toHaveLength(0);
    expect(audits.some((audit) => audit.action === "cedco.d02.dialer_dry_run_accepted")).toBe(true);
    expect(JSON.stringify(audits)).not.toMatch(
      /phoneNumber|to_number|rawTranscript|audioUrl|token|secret|password|\+57/iu,
    );
  });

  it("accepts header idempotency key and still avoids provider egress", async () => {
    const { idempotency_key: _idempotencyKey, ...payloadWithoutKey } = safePayload;
    const response = await harness.app.inject({
      method: "POST",
      url,
      headers: {
        ...headers,
        "x-correlation-id": "corr-cedco-d02-dialer-integration-header",
        "Idempotency-Key": "hyperion-key-d02-integration-header",
      },
      payload: payloadWithoutKey,
    });
    const body =
      response.json<
        Envelope<{ status: string; provider_egress: boolean; would_call_provider: boolean }>
      >();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.provider_egress).toBe(false);
    expect(body.data?.would_call_provider).toBe(false);
  });

  it.each([
    ["phone", { phone: "blocked-phone" }],
    ["rawTranscript", { metadata: { rawTranscript: "unsafe" } }],
    ["token", { metadata: { token: "unsafe-token" } }],
  ] as const)("rejects %s before persistence", async (_label, patch) => {
    const response = await harness.app.inject({
      method: "POST",
      url,
      headers,
      payload: { ...safePayload, ...patch },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toMatch(/blocked-phone|unsafe-token/iu);

    const audits = await harness.prisma.auditLog.findMany({
      where: { tenantId: "cedco-test" },
    });
    expect(JSON.stringify(audits)).not.toMatch(/blocked-phone|rawTranscript|unsafe-token/iu);
  });
});
