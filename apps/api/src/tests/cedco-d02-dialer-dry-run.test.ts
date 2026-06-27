import { describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";

const url = "/api/v1/tenants/cedco-test/products/cedco/d02/dialer/dry-run";

const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-cedco-d02-dialer-api-001",
};

const safePayload = {
  idempotency_key: "hyperion-key-d02-api-001",
  safe_contact_ref: "safe-contact-ref-d02-api",
  patient_context_ref: "patient-context-ref-d02-api",
  cedco_site_id: "site-ref-d02-api",
  service_id: "service-ref-d02-api",
  agreement_id: "agreement-ref-d02-api",
  call_purpose: "orientation",
  objective: "orientation",
  consent: { granted: true },
  consent_ref: "consent-ref-d02-api",
  dynamic_vars: { purpose: "orientation" },
  metadata: {
    source: "api-test",
    safeContactRef: "safe-contact-ref-d02-api",
  },
} as const;

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly meta: { readonly correlationId: string };
}

describe("CEDCO D02 dialer dry-run API", () => {
  it("returns dry_run_accepted without provider egress", async () => {
    const services = createFakeApiServices();
    const app = await createApiApp({ services });

    const response = await app.inject({
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
        blocked_reasons: string[];
      }>
    >();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.provider_egress).toBe(false);
    expect(body.data?.would_call_provider).toBe(false);
    expect(body.data?.safe_contact_ref).toBe("safe-contact-ref-d02-api");
    expect(body.data?.blocked_reasons).toEqual([]);
    expect(body.meta.correlationId).toBe("corr-cedco-d02-dialer-api-001");

    await app.close();
  });

  it("accepts Idempotency-Key header when body key is absent", async () => {
    const { idempotency_key: _idempotencyKey, ...payloadWithoutKey } = safePayload;
    const app = await createApiApp();

    const response = await app.inject({
      method: "POST",
      url,
      headers: { ...headers, "Idempotency-Key": "hyperion-key-d02-header-001" },
      payload: payloadWithoutKey,
    });
    const body = response.json<Envelope<{ status: string; internal_call_id: string }>>();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.internal_call_id).toBe("dryrun_hyperion-key-d02-header-001");

    await app.close();
  });

  it("blocks missing idempotency key without calling a provider", async () => {
    const { idempotency_key: _idempotencyKey, ...payloadWithoutKey } = safePayload;
    const app = await createApiApp();

    const response = await app.inject({
      method: "POST",
      url,
      headers,
      payload: payloadWithoutKey,
    });
    const body =
      response.json<
        Envelope<{ status: string; blocked_reasons: string[]; provider_egress: boolean }>
      >();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("blocked");
    expect(body.data?.blocked_reasons).toContain("missing_idempotency_key");
    expect(body.data?.provider_egress).toBe(false);

    await app.close();
  });

  it("blocks consent.granted=false", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers,
      payload: { ...safePayload, consent: { granted: false } },
    });
    const body = response.json<Envelope<{ status: string; blocked_reasons: string[] }>>();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("blocked");
    expect(body.data?.blocked_reasons).toContain("missing_consent");

    await app.close();
  });

  it.each([
    ["phone", { phone: "blocked-phone" }],
    ["phoneNumber", { phoneNumber: "blocked-phone" }],
    ["to_number", { to_number: "blocked-phone" }],
    ["from_number", { from_number: "blocked-phone" }],
    ["agent_id", { metadata: { agent_id: "agent_1234567890abcdef" } }],
    ["phone_number_id", { metadata: { phone_number_id: "phone_1234567890abcdef" } }],
    ["rawTranscript", { metadata: { rawTranscript: "unsafe" } }],
    ["transcript", { metadata: { transcript: "unsafe" } }],
    ["audioUrl", { metadata: { audioUrl: "https://example.invalid/audio.wav" } }],
    ["recordingUrl", { metadata: { recordingUrl: "https://example.invalid/recording.wav" } }],
    ["audio_b64", { metadata: { audio_b64: "unsafe" } }],
    ["rawPayload", { metadata: { rawPayload: { unsafe: true } } }],
    ["token", { metadata: { token: "unsafe-token" } }],
    ["secret", { metadata: { secret: "unsafe-secret" } }],
    ["password", { metadata: { password: "unsafe-password" } }],
    ["apiKey", { metadata: { apiKey: "unsafe-key" } }],
  ] as const)("rejects forbidden %s before dry-run execution", async (_label, patch) => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers,
      payload: { ...safePayload, ...patch },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toMatch(/blocked-phone|unsafe-token|unsafe-secret/iu);

    await app.close();
  });

  it("records safe audit events without PII", async () => {
    const services = createFakeApiServices();
    const app = await createApiApp({ services });
    const response = await app.inject({
      method: "POST",
      url,
      headers,
      payload: safePayload,
    });

    const audit = JSON.stringify(services.observability?.getAuditEvents?.());
    expect(response.statusCode).toBe(200);
    expect(audit).toContain("cedco.d02.dialer_dry_run_requested");
    expect(audit).toContain("cedco.d02.dialer_dry_run_accepted");
    expect(audit).not.toMatch(/phone|rawTranscript|audioUrl|token|secret|password/iu);

    await app.close();
  });

  it("does not expose a live dispatch route", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/tenants/cedco-test/products/cedco/d02/dialer/dispatch",
      headers,
      payload: safePayload,
    });
    expect([403, 404, 405]).toContain(response.statusCode);
    await app.close();
  });
});
