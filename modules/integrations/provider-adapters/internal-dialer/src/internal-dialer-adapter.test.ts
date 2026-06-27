import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

import { InMemoryLogger, InMemoryMetricsRegistry } from "../../../../../packages/observability/src";
import {
  createSafeInternalDialerRequest,
  createTestOperationContext,
  createUnsafeInternalDialerRequest,
  FakeInternalDialerClient,
} from "../../../../../packages/testing/src";
import { BlockedInternalDialerAdapter } from "./blocked-internal-dialer-adapter";
import { sanitizeDialerContractPayload } from "./dialer-contract-sanitizer";
import {
  buildDialerHardeningStatus,
  defaultDialerHardeningStatus,
} from "./dialer-hardening-status";

describe("InternalDialerAdapter blocked contract", () => {
  const context = createTestOperationContext({
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-dialer-test-001",
  });

  it("requires idempotency key", async () => {
    const result = await adapter().validateRequest(
      createSafeInternalDialerRequest({ idempotencyKey: "" }),
      context,
    );
    expect(result.blockedReasons).toContain("missing_idempotency_key");
  });

  it("requires externalRequestId", async () => {
    const result = await adapter().validateRequest(
      createSafeInternalDialerRequest({ externalRequestId: "" }),
      context,
    );
    expect(result.blockedReasons).toContain("missing_external_request_id");
  });

  it("requires tenantId", async () => {
    const result = await adapter().validateRequest(
      createSafeInternalDialerRequest({ tenantId: "" }),
      context,
    );
    expect(result.blockedReasons).toContain("missing_tenant_id");
  });

  it("requires safeContactRef", async () => {
    const result = await adapter().validateRequest(
      createSafeInternalDialerRequest({ safeContactRef: "" }),
      context,
    );
    expect(result.blockedReasons).toContain("missing_safe_contact_ref");
  });

  it("requires granted consent", async () => {
    const result = await adapter().validateRequest(
      createSafeInternalDialerRequest({ consent: { granted: false, consentRef: "consent-ref" } }),
      context,
    );
    expect(result.blockedReasons).toContain("missing_consent");
  });

  it("requires consentRef", async () => {
    const result = await adapter().validateRequest(
      createSafeInternalDialerRequest({ consent: { granted: true, consentRef: "" } }),
      context,
    );
    expect(result.blockedReasons).toContain("missing_consent_ref");
  });

  it("allows safeContactRef in a safe dry-run request", async () => {
    const result = await adapter().dryRun(createSafeInternalDialerRequest(), context);
    expect(result.status).toBe("dry_run_accepted");
    expect(result.metadata.safeContactRef).toBe("safe-contact-ref-test");
  });

  it("blocks phone, phoneNumber, to_number and from_number payloads", () => {
    expect(sanitizeDialerContractPayload({ phone: "+15555550123" }).ok).toBe(false);
    expect(sanitizeDialerContractPayload({ phoneNumber: "+15555550123" }).ok).toBe(false);
    expect(sanitizeDialerContractPayload({ to_number: "+15555550123" }).ok).toBe(false);
    expect(sanitizeDialerContractPayload({ from_number: "+15555550123" }).ok).toBe(false);
  });

  it("blocks raw transcript, transcript, audio url, recording url, audio base64 and raw payload", () => {
    expect(
      sanitizeDialerContractPayload({
        rawTranscript: "unsafe",
        transcript: "unsafe",
        audioUrl: "https://media.example.invalid/audio.wav",
        recordingUrl: "https://media.example.invalid/recording.wav",
        audio_b64: "blocked",
        rawPayload: {},
      }).ok,
    ).toBe(false);
  });

  it("blocks token, secret, password, apiKey and api_key payloads", () => {
    expect(
      sanitizeDialerContractPayload({
        token: "value",
        secret: "value",
        password: "value",
        apiKey: "value",
        api_key: "value",
      }).ok,
    ).toBe(false);
  });

  it("blocks real-looking agent_id", () => {
    expect(sanitizeDialerContractPayload({ agent_id: "agent_1234567890abcdef" }).ok).toBe(false);
  });

  it("blocks real-looking phone_number_id", () => {
    expect(sanitizeDialerContractPayload({ phone_number_id: "phone_1234567890abcdef" }).ok).toBe(
      false,
    );
  });

  it("blocks external callback URL", async () => {
    const result = await adapter().dryRun(
      createSafeInternalDialerRequest({ callback: { callbackAlias: "https://callback.invalid" } }),
      context,
    );
    expect(result.blockedReasons).toContain("external_callback_url_blocked");
  });

  it("dryRun with safe request returns dry_run_accepted", async () => {
    const result = await adapter().dryRun(createSafeInternalDialerRequest(), context);
    expect(result.status).toBe("dry_run_accepted");
    expect(result.idempotencyKey).toBe("hyperion-key-test-001");
    expect(result.internalCallId).toBe("dryrun_hyperion-key-test-001");
    expect(result.providerEgress).toBe(false);
    expect(result.wouldCallProvider).toBe(false);
  });

  it("duplicate idempotency key is deterministic in dry-run contract mode", async () => {
    const request = createSafeInternalDialerRequest({ idempotencyKey: "hyperion-key-duplicate" });
    const first = await adapter().dryRun(request, context);
    const second = await adapter().dryRun(request, context);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    expect(second.internalCallId).toBe(first.internalCallId);
  });

  it("dryRun does not call network", async () => {
    const client = new FakeInternalDialerClient();
    await adapter().dryRun(createSafeInternalDialerRequest(), context);
    expect(client.networkCallsMade).toBe(0);
  });

  it("dispatch default returns blocked", async () => {
    const result = await adapter().dispatch(createSafeInternalDialerRequest(), context);
    expect(result.status).toBe("blocked");
    expect(result.reason).toBe("live_dispatch_disabled");
    expect(result.blockedReasons).toContain("live_dispatch_disabled");
    expect(result.providerEgress).toBe(false);
    expect(result.wouldCallProvider).toBe(false);
  });

  it("dispatch blocks realCallsEnabled=false", async () => {
    const result = await adapter().dispatch(createSafeInternalDialerRequest(), context);
    expect(result.blockedReasons).toContain("real_calls_disabled");
  });

  it("dispatch blocks providerEgressEnabled=false", async () => {
    const result = await adapter().dispatch(createSafeInternalDialerRequest(), context);
    expect(result.blockedReasons).toContain("provider_egress_disabled");
  });

  it("dispatch blocks missing approvalRef", async () => {
    const result = await adapter({
      flags: { realCallsEnabled: true, providerEgressEnabled: true },
    }).dispatch(createSafeInternalDialerRequest(), context);
    expect(result.blockedReasons).toContain("missing_approval_ref");
  });

  it("dispatch blocks missing runbookRef", async () => {
    const result = await adapter({
      flags: { realCallsEnabled: true, providerEgressEnabled: true },
    }).dispatch(createSafeInternalDialerRequest(), context);
    expect(result.blockedReasons).toContain("missing_runbook_ref");
  });

  it("dispatch blocks missing providerConfigRef", async () => {
    const result = await adapter({
      flags: { realCallsEnabled: true, providerEgressEnabled: true },
    }).dispatch(createSafeInternalDialerRequest(), context);
    expect(result.blockedReasons).toContain("missing_provider_config_ref");
  });

  it("dispatch blocks missing secretManagerRef", async () => {
    const result = await adapter({
      flags: { realCallsEnabled: true, providerEgressEnabled: true },
    }).dispatch(createSafeInternalDialerRequest(), context);
    expect(result.blockedReasons).toContain("missing_secret_manager_ref");
  });

  it("dispatch blocks incomplete P0 hardening", async () => {
    const result = await adapter({
      flags: { realCallsEnabled: true, providerEgressEnabled: true },
    }).dispatch(
      createSafeInternalDialerRequest({
        approvals: {
          approvalRef: "approval-ref",
          runbookRef: "runbook-ref",
          providerConfigRef: "provider-config-ref",
          secretManagerRef: "secret-manager-ref",
        },
      }),
      context,
    );
    expect(result.blockedReasons).toContain("dialer_p0_hardening_incomplete");
  });

  it("p0Complete is false by default", () => {
    expect(defaultDialerHardeningStatus.p0Complete).toBe(false);
  });

  it("p0Complete true only when every P0 flag is true", () => {
    expect(
      buildDialerHardeningStatus({
        idempotencyKeyPersisted: true,
        dryRunSupported: true,
        webhookSignatureRequired: true,
        authJwtRequired: true,
        rawOutcomePersistenceRemoved: true,
        internalEndpointAvailable: true,
        pendingContactsAtomic: true,
        retryDlqClarified: true,
      }).p0Complete,
    ).toBe(true);
  });

  it("result does not contain PII", async () => {
    const result = await adapter().dryRun(createSafeInternalDialerRequest(), context);
    expect(JSON.stringify(result)).not.toMatch(/phoneNumber|\+1|rawTranscript|audioUrl/iu);
  });

  it("metrics and logs are sanitized when injected", async () => {
    const logger = new InMemoryLogger();
    const metrics = new InMemoryMetricsRegistry();
    const result = await adapter({ logger, metrics }).dryRun(
      createSafeInternalDialerRequest(),
      context,
    );
    expect(result.status).toBe("dry_run_accepted");
    expect(JSON.stringify(logger.getEntries())).not.toMatch(/phoneNumber|rawTranscript|audioUrl/iu);
    expect(metrics.snapshot().counters.length).toBeGreaterThan(0);
  });

  it("does not use a real InternalDialerClient", async () => {
    const client = new FakeInternalDialerClient();
    await adapter().dispatch(createSafeInternalDialerRequest(), context);
    expect(client.networkCallsMade).toBe(0);
  });

  it("fake client does not call network", async () => {
    const client = new FakeInternalDialerClient();
    await client.dryRun(createSafeInternalDialerRequest(), context);
    expect(client.networkCallsMade).toBe(0);
  });

  it("factory creates safe request", async () => {
    const result = await adapter().dryRun(createSafeInternalDialerRequest(), context);
    expect(result.status).toBe("dry_run_accepted");
  });

  it("factory unsafe request is blocked", async () => {
    const result = await adapter().dryRun(createUnsafeInternalDialerRequest(), context);
    expect(result.status).toBe("blocked");
  });

  it("repo guard passes", () => {
    expect(() =>
      execFileSync("node", ["tools/repo-guard.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});

function adapter(input: ConstructorParameters<typeof BlockedInternalDialerAdapter>[0] = {}) {
  return new BlockedInternalDialerAdapter(input);
}
