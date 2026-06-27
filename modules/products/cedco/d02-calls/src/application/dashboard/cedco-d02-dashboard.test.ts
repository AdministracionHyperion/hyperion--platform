import { describe, expect, it } from "vitest";
import {
  buildCedcoD02DashboardSummary,
  buildCedcoD02EvalDashboardSummary,
  buildCedcoD02MockFlowSummary,
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
});
