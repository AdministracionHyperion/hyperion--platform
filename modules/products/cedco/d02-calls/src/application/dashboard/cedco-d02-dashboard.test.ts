import { describe, expect, it } from "vitest";
import {
  buildCedcoD02DashboardSummary,
  buildCedcoD02EvalDashboardSummary,
  buildCedcoD02MockFlowSummary,
  buildCedcoD02OperationalReport,
} from "./index";

describe("CEDCO D02 dashboard summary", () => {
  it("builds CEDCO dashboard summary", () => {
    const dashboard = buildCedcoD02DashboardSummary({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
    });
    expect(dashboard.tenantId).toBe("cedco-test");
    expect(dashboard.summaryCards.length).toBeGreaterThan(0);
  });

  it("builds mock flow summary with synthetic provider ref", () => {
    const flows = buildCedcoD02MockFlowSummary({ correlationId: "corr-dashboard-001" });
    expect(flows[0]?.providerCallRef).toContain("mock_call_");
  });

  it("builds eval dashboard summary from deterministic suite", () => {
    const summary = buildCedcoD02EvalDashboardSummary();
    expect(summary.grade).toBe("pass");
    expect(summary.criticalFailed).toBe(0);
  });

  it("does not expose unsafe data", () => {
    const dashboard = buildCedcoD02DashboardSummary({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
      auditPreview: [
        {
          auditId: "audit-dashboard-unsafe",
          action: "operations.dashboard.read",
          severity: "info",
          occurredAt: "2026-06-27T00:00:00.000Z",
          correlationId: "corr-dashboard-001",
          metadata: { rawPayload: "blocked", token: "blocked" },
        },
      ],
    });
    expect(JSON.stringify(dashboard)).not.toMatch(/rawPayload|token/u);
  });

  it("builds operational report with excluded live scope", () => {
    const dashboard = buildCedcoD02DashboardSummary({
      tenantId: "cedco-test",
      correlationId: "corr-dashboard-001",
    });
    const report = buildCedcoD02OperationalReport(dashboard);
    expect(report.reportStatus).toBe("ready_for_staging_demo");
    expect(report.scope).toMatchObject({
      realCallsEnabled: false,
      continuousCallsEnabled: false,
      providerEgressEnabled: false,
      pbxRuntimeConnected: false,
      inventoryVerticalIncluded: false,
    });
    expect(report.kpis.mockCallFlowsTotal).toBeGreaterThan(0);
    expect(report.complianceMatrix.map((control) => control.key)).toEqual(
      expect.arrayContaining([
        "auth_staging_boundary",
        "eligibility_contactability",
        "provider_egress",
        "pbx_runtime",
        "inventory_vertical",
      ]),
    );
    expect(JSON.stringify(report)).not.toMatch(/rawTranscript|audioUrl|phoneNumber|token/iu);
  });
});
