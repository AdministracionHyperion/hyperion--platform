import { describe, expect, it } from "vitest";
import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  metricNames,
} from "../../../../packages/observability/src";
import {
  createRuntimeSafetyFlags,
  createTestPolicyGateActorContext,
  createTestPolicyGateContext,
} from "../../../../packages/testing/src/core";
import { evaluatePolicyGate } from "./use-cases/evaluate-policy-gate";

describe("policy gates", () => {
  it.each([
    ["call.dispatch", "real_calls_disabled"],
    ["provider.egress", "provider_egress_disabled"],
    ["production.deploy", "production_deploy_disabled"],
    ["raw_transcript.enable", "raw_transcript_disabled"],
    ["raw_recording.enable", "raw_recording_disabled"],
    ["data.export", "data_export_disabled"],
  ] as const)("blocks %s by default", async (action, reason) => {
    const result = await evaluatePolicyGate({
      context: createTestPolicyGateContext(),
      actor: createTestPolicyGateActorContext(["tenant-admin"]),
      action,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain(reason);
  });

  it.each([
    ["humanApprovalRef", "missing_human_approval"],
    ["runbookRef", "missing_runbook"],
    ["providerConfigRef", "missing_provider_configuration"],
    ["secretManagerRef", "missing_secret_manager"],
  ] as const)("real call requires %s", async (missingRef, expectedReason) => {
    const refs = {
      humanApprovalRef: "approval-test",
      runbookRef: "runbook-test",
      providerConfigRef: "provider-config-test",
      secretManagerRef: "secret-manager-test",
    };
    delete refs[missingRef];

    const result = await evaluatePolicyGate({
      context: createTestPolicyGateContext(),
      actor: createTestPolicyGateActorContext(["voice-operator"]),
      action: "call.dispatch",
      flags: createRuntimeSafetyFlags({ realCallsEnabled: true }),
      ...refs,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain(expectedReason);
  });

  it("blocks missing permission", async () => {
    const result = await evaluatePolicyGate({
      context: createTestPolicyGateContext(),
      actor: createTestPolicyGateActorContext(["tenant-viewer"]),
      action: "call.dispatch",
      flags: createRuntimeSafetyFlags({ realCallsEnabled: true }),
      humanApprovalRef: "approval-test",
      runbookRef: "runbook-test",
      providerConfigRef: "provider-config-test",
      secretManagerRef: "secret-manager-test",
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("missing_permission");
  });

  it("allows controlled real call only when flags permissions and refs are present", async () => {
    const result = await evaluatePolicyGate({
      context: createTestPolicyGateContext(),
      actor: createTestPolicyGateActorContext(["voice-operator"]),
      action: "call.dispatch",
      flags: createRuntimeSafetyFlags({ realCallsEnabled: true }),
      humanApprovalRef: "approval-test",
      runbookRef: "runbook-test",
      providerConfigRef: "provider-config-test",
      secretManagerRef: "secret-manager-test",
    });

    expect(result).toMatchObject({ allowed: true, reasons: [] });
  });

  it("sanitizes sensitive metadata", async () => {
    const result = await evaluatePolicyGate({
      context: createTestPolicyGateContext(),
      actor: createTestPolicyGateActorContext(["tenant-admin"]),
      action: "data.export",
      metadata: { token: "blocked-token", phone: "blocked-phone", safe: "ok" },
    });

    expect(JSON.stringify(result.metadata)).not.toContain("blocked-token");
    expect(JSON.stringify(result.metadata)).not.toContain("blocked-phone");
    expect(result.metadata).toMatchObject({ safe: "ok" });
  });

  it("records audit and metrics for denied policy gates", async () => {
    const metrics = new InMemoryMetricsRegistry();
    const logger = new InMemoryLogger();
    const audits: unknown[] = [];

    const result = await evaluatePolicyGate({
      context: createTestPolicyGateContext(),
      actor: createTestPolicyGateActorContext(["tenant-admin"]),
      action: "provider.egress",
      metrics,
      logger,
      audit: {
        recordPolicyGateAudit: async (event) => {
          audits.push(event);
        },
      },
    });

    expect(result.allowed).toBe(false);
    expect(audits).toHaveLength(1);
    expect(
      metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.policyGateDeniedTotal),
    ).toBe(true);
    expect(logger.getEntries().some((entry) => entry.eventName === "policy.gate.denied")).toBe(
      true,
    );
  });
});
