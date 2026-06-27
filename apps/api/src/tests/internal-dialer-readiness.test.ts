import { describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";

const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-dialer-readiness-001",
};
const baseUrl = "/api/v1/tenants/cedco-test/integrations/internal-dialer";

const safeDryRunPayload = {
  idempotency_key: "hyperion-key-api-001",
  safe_contact_ref: "safe-contact-ref-test",
  agent_alias: "cedco-agent-alias",
  caller_alias: "cedco-caller-alias",
  consent: { granted: true },
  consent_ref: "consent-ref-test",
  dynamic_vars: { purpose: "orientation" },
};

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly meta: { readonly correlationId: string };
}

describe("internal dialer readiness API", () => {
  it("readiness returns p0Complete=false and all P0 blockers", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "GET",
      url: `${baseUrl}/readiness`,
      headers,
    });
    const body =
      response.json<Envelope<{ hardeningStatus: { p0Complete: boolean }; checklist: unknown[] }>>();
    expect(response.statusCode).toBe(200);
    expect(body.data?.hardeningStatus.p0Complete).toBe(false);
    expect(body.data?.checklist).toHaveLength(8);
    expect(JSON.stringify(body)).toContain("Idempotency key persisted");
    await app.close();
  });

  it("dry-run safe request returns dry_run_accepted without provider egress", async () => {
    const services = createFakeApiServices();
    const app = await createApiApp({ services });
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: safeDryRunPayload,
    });
    const body = response.json<
      Envelope<{
        status: string;
        idempotency_key: string;
        internal_call_id: string;
        provider_egress: boolean;
        would_call_provider: boolean;
      }>
    >();
    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.idempotency_key).toBe("hyperion-key-api-001");
    expect(body.data?.internal_call_id).toBe("dryrun_hyperion-key-api-001");
    expect(body.data?.provider_egress).toBe(false);
    expect(body.data?.would_call_provider).toBe(false);
    expect(body.meta.correlationId).toBe("corr-dialer-readiness-001");
    expect(JSON.stringify(services.observability?.metrics.snapshot())).not.toContain(
      "provider_blocked_requests_total",
    );
    await app.close();
  });

  it("dry-run accepts Idempotency-Key header when body key is absent", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers: { ...headers, "Idempotency-Key": "hyperion-key-header-001" },
      payload: { ...safeDryRunPayload, idempotency_key: undefined },
    });
    const body = response.json<Envelope<{ status: string; idempotency_key: string }>>();
    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.idempotency_key).toBe("hyperion-key-header-001");
    await app.close();
  });

  it("dry-run without idempotency key is blocked", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: { ...safeDryRunPayload, idempotency_key: undefined },
    });
    const body = response.json<Envelope<{ status: string; blocked_reasons: string[] }>>();
    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("blocked");
    expect(body.data?.blocked_reasons).toContain("missing_idempotency_key");
    await app.close();
  });

  it("dry-run with phoneNumber is rejected by runtime blockers", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: { ...safeDryRunPayload, phoneNumber: "+15555550123" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain("+15555550123");
    await app.close();
  });

  it.each([
    ["agent_id", { metadata: { agent_id: "agent_1234567890123456" } }],
    ["phone_number_id", { metadata: { phone_number_id: "phone_1234567890123456" } }],
    ["rawTranscript", { metadata: { rawTranscript: "unsafe" } }],
    ["audioUrl", { metadata: { audioUrl: "https://example.invalid/audio.wav" } }],
    ["token", { metadata: { token: "unsafe-token" } }],
  ] as const)("dry-run rejects %s before adapter execution", async (_label, patch) => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: { ...safeDryRunPayload, ...patch },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it.each([
    ["external callback URL", { callback_alias: "https://example.invalid/callback" }],
    ["future live runtime mode", { runtimeMode: "future_live" }],
  ] as const)("dry-run blocks %s", async (_label, patch) => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dry-run`,
      headers,
      payload: { ...safeDryRunPayload, ...patch },
    });
    const body = response.json<Envelope<{ status: string; blocked_reasons: string[] }>>();
    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("blocked");
    expect(body.data?.blocked_reasons.length).toBeGreaterThan(0);
    await app.close();
  });

  it("does not expose a dispatch route", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/dispatch`,
      headers,
      payload: safeDryRunPayload,
    });
    expect([403, 404, 405]).toContain(response.statusCode);
    await app.close();
  });
});
