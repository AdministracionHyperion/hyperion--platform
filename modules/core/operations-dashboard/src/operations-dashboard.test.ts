import { describe, expect, it } from "vitest";
import {
  buildOperationalDashboard,
  defaultDashboardRuntimeSafety,
  sanitizeDashboardData,
} from "./index";

describe("operations dashboard core", () => {
  it("builds dashboard summary with safe data", () => {
    const dashboard = buildOperationalDashboard({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
      generatedAt: new Date("2026-06-27T00:00:00.000Z"),
      evalSummary: evalSummary(),
    });
    expect(dashboard.summaryCards.length).toBeGreaterThan(0);
    expect(dashboard.overallStatus).toBe("healthy");
  });

  it.each(["phoneNumber", "rawTranscript", "audioUrl", "token", "rawPayload"] as const)(
    "sanitizeDashboardData removes %s",
    (field) => {
      const sanitized = sanitizeDashboardData({ safe: true, [field]: "blocked" });
      expect(JSON.stringify(sanitized)).not.toContain(field);
    },
  );

  it("runtimeSafety keeps real calls disabled", () => {
    expect(defaultDashboardRuntimeSafety().realCallsEnabled).toBe(false);
  });

  it("runtimeSafety keeps provider egress disabled", () => {
    expect(defaultDashboardRuntimeSafety().providerEgressEnabled).toBe(false);
  });

  it("policyGateSummary marks real calls blocked", () => {
    const dashboard = buildOperationalDashboard({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
      evalSummary: evalSummary(),
    });
    expect(dashboard.policyGateSummary.realCallsBlocked).toBe(true);
  });

  it("evalSummary carries grade", () => {
    const dashboard = buildOperationalDashboard({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
      evalSummary: evalSummary(),
    });
    expect(dashboard.evalSummary.grade).toBe("pass");
  });

  it("does not expose PII, raw media, or provider URLs", () => {
    const dashboard = buildOperationalDashboard({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
      evalSummary: evalSummary(),
      auditPreview: [
        {
          auditId: "audit-dashboard-001",
          action: "operations.dashboard.read",
          severity: "info",
          occurredAt: "2026-06-27T00:00:00.000Z",
          correlationId: "corr-dashboard-001",
          metadata: {
            phoneNumber: "blocked",
            rawTranscript: "blocked",
            audioUrl: "https://blocked.invalid/file.wav",
            providerUrl: "https://api.elevenlabs.example.invalid",
          },
        },
      ],
    });
    const text = JSON.stringify(dashboard);
    expect(text).not.toMatch(/phoneNumber|rawTranscript|audioUrl|elevenlabs/iu);
  });
});

function evalSummary() {
  return {
    suiteName: "CEDCO D02 Full Deterministic Eval Suite",
    percentage: 100,
    weightedPercentage: 100,
    grade: "pass" as const,
    totalCases: 76,
    passed: 76,
    failed: 0,
    criticalFailed: 0,
    lastRunLabel: "deterministic-local-suite",
  };
}
