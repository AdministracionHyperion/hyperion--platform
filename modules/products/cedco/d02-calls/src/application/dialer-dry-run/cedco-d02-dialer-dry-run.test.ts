import { describe, expect, it } from "vitest";

import {
  runCedcoD02InternalDialerDryRun,
  type CedcoD02InternalDialerDryRunPort,
  type CedcoD02InternalDialerDryRunRequest,
  type CedcoD02InternalDialerDryRunResult,
} from "./run-cedco-d02-internal-dialer-dry-run";

describe("CEDCO D02 internal dialer dry-run flow", () => {
  it("returns dry_run_accepted for a safe D02 intent", async () => {
    const dialer = createFakeDialer();
    const result = await runCedcoD02InternalDialerDryRun({
      intent: safeIntent(),
      dialer,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.status).toBe("dry_run_accepted");
    expect(result.ok && result.value.providerEgress).toBe(false);
    expect(result.ok && result.value.wouldCallProvider).toBe(false);
    expect(dialer.requests).toHaveLength(1);
    expect(dialer.requests[0]).toMatchObject({
      idempotency_key: "hyperion-key-d02-h3-001",
      safe_contact_ref: "safe-contact-ref-h3",
      consent: { granted: true },
      consent_ref: "consent-ref-h3",
    });
  });

  it("returns blocked when idempotency key is missing", async () => {
    const { idempotencyKey: _idempotencyKey, ...intentWithoutIdempotency } = safeIntent();
    const result = await runCedcoD02InternalDialerDryRun({
      intent: intentWithoutIdempotency,
      dialer: createFakeDialer(),
    });
    expect(result.ok && result.value.status).toBe("blocked");
    expect(result.ok && result.value.blockedReasons).toContain("missing_idempotency_key");
  });

  it("returns blocked when safe_contact_ref is missing", async () => {
    const result = await runCedcoD02InternalDialerDryRun({
      intent: { ...safeIntent(), safeContactRef: "" },
      dialer: createFakeDialer(),
    });
    expect(result.ok && result.value.status).toBe("blocked");
    expect(result.ok && result.value.blockedReasons).toContain("missing_safe_contact_ref");
  });

  it("returns blocked when consent_ref is missing", async () => {
    const result = await runCedcoD02InternalDialerDryRun({
      intent: { ...safeIntent(), consentRef: "" },
      dialer: createFakeDialer(),
    });
    expect(result.ok && result.value.status).toBe("blocked");
    expect(result.ok && result.value.blockedReasons).toContain("missing_consent_ref");
  });

  it("returns blocked when consent is not granted", async () => {
    const result = await runCedcoD02InternalDialerDryRun({
      intent: { ...safeIntent(), consent: { granted: false } },
      dialer: createFakeDialer(),
    });
    expect(result.ok && result.value.status).toBe("blocked");
    expect(result.ok && result.value.blockedReasons).toContain("missing_consent");
  });

  it.each([
    ["phone", { metadata: { phone: "blocked-phone" } }],
    ["phoneNumber", { metadata: { phoneNumber: "blocked-phone" } }],
    ["to_number", { metadata: { to_number: "blocked-phone" } }],
    ["from_number", { metadata: { from_number: "blocked-phone" } }],
    ["agent_id", { metadata: { agent_id: "agent_1234567890abcdef" } }],
    ["phone_number_id", { metadata: { phone_number_id: "phone_1234567890abcdef" } }],
    ["rawTranscript", { metadata: { rawTranscript: "blocked" } }],
    ["transcript", { metadata: { transcript: "blocked" } }],
    ["audioUrl", { metadata: { audioUrl: "https://example.invalid/audio.wav" } }],
    ["recordingUrl", { metadata: { recordingUrl: "https://example.invalid/recording.wav" } }],
    ["audio_b64", { metadata: { audio_b64: "blocked" } }],
    ["rawPayload", { metadata: { rawPayload: { blocked: true } } }],
    ["token", { metadata: { token: "blocked" } }],
    ["secret", { metadata: { secret: "blocked" } }],
    ["password", { metadata: { password: "blocked" } }],
    ["apiKey", { metadata: { apiKey: "blocked" } }],
  ] as const)("fails before dialer execution when %s is present", async (_label, patch) => {
    const dialer = createFakeDialer();
    const result = await runCedcoD02InternalDialerDryRun({
      intent: { ...safeIntent(), ...patch },
      dialer,
    });
    expect(result.ok).toBe(false);
    expect(dialer.requests).toHaveLength(0);
  });

  it("records safe audit events without PII", async () => {
    const auditEvents: unknown[] = [];
    const result = await runCedcoD02InternalDialerDryRun({
      intent: safeIntent(),
      dialer: createFakeDialer(),
      audit: {
        record: async (event) => {
          auditEvents.push(event);
        },
      },
    });
    expect(result.ok).toBe(true);
    expect(auditEvents).toHaveLength(2);
    expect(JSON.stringify(auditEvents)).not.toMatch(
      /phone|rawTranscript|audioUrl|token|secret|password/iu,
    );
  });

  it("fails closed if a port reports provider egress", async () => {
    const result = await runCedcoD02InternalDialerDryRun({
      intent: safeIntent(),
      dialer: {
        dryRun: async () =>
          ({
            status: "dry_run_accepted",
            idempotency_key: "hyperion-key-d02-h3-001",
            internal_call_id: "dryrun_hyperion-key-d02-h3-001",
            blocked_reasons: [],
            would_call_provider: false,
            provider_egress: true,
            metadata: {},
          }) as unknown as CedcoD02InternalDialerDryRunResult,
      },
    });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe("forbidden");
  });
});

function safeIntent() {
  return {
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-d02-dialer-h3-001",
    idempotencyKey: "hyperion-key-d02-h3-001",
    safeContactRef: "safe-contact-ref-h3",
    patientContextRef: "patient-context-ref-h3",
    cedcoSiteId: "site-ref-h3",
    serviceId: "service-ref-h3",
    agreementId: "agreement-ref-h3",
    callPurpose: "orientation" as const,
    objective: "orientation" as const,
    consent: { granted: true },
    consentRef: "consent-ref-h3",
    metadata: { source: "unit-test", safeContactRef: "safe-contact-ref-h3" },
    dynamicVars: { purpose: "orientation" },
  };
}

function createFakeDialer(): CedcoD02InternalDialerDryRunPort & {
  readonly requests: CedcoD02InternalDialerDryRunRequest[];
} {
  const requests: CedcoD02InternalDialerDryRunRequest[] = [];
  return {
    requests,
    dryRun: async (request) => {
      requests.push(request);
      const blockedReasons = [
        ...(request.idempotency_key ? [] : ["missing_idempotency_key"]),
        ...(request.safe_contact_ref ? [] : ["missing_safe_contact_ref"]),
        ...(request.consent.granted ? [] : ["missing_consent"]),
        ...(request.consent_ref ? [] : ["missing_consent_ref"]),
      ];
      return {
        status: blockedReasons.length > 0 ? "blocked" : "dry_run_accepted",
        idempotency_key: request.idempotency_key ?? "missing",
        internal_call_id: `dryrun_${request.idempotency_key ?? "missing"}`,
        blocked_reasons: blockedReasons,
        would_call_provider: false,
        provider_egress: false,
        metadata: { source: "fake-dialer" },
      };
    },
  };
}
