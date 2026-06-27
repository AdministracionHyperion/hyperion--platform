import { describe, expect, it } from "vitest";
import { createDashboardFixture } from "../../../../../packages/testing/src";
import { renderDashboardShell } from "../components/dashboard-shell";
import { renderDisabledControlsPanel } from "../components/disabled-controls-panel";
import { renderEvalSummaryPanel } from "../components/eval-summary-panel";
import { renderMockCallFlowTable } from "../components/mock-call-flow-table";
import { renderPolicyGatePanel } from "../components/policy-gate-panel";
import { renderProviderEventTable } from "../components/provider-event-table";
import { renderRuntimeSafetyPanel } from "../components/runtime-safety-panel";
import { renderStatusPill } from "../components/status-pill";
import { renderSummaryCard } from "../components/summary-card";

describe("operational dashboard components", () => {
  const dashboard = createDashboardFixture();

  it("summary cards render", () => {
    expect(renderSummaryCard(dashboard.summaryCards[0]!)).toContain("summary-card");
  });

  it("status pill renders states", () => {
    expect(renderStatusPill("healthy")).toContain("healthy");
  });

  it("mock call table renders mock provider ref", () => {
    expect(renderMockCallFlowTable(dashboard.mockCallFlows)).toContain("mock_call_");
  });

  it("provider events table renders event status", () => {
    expect(renderProviderEventTable(dashboard.providerEvents)).toContain("processed");
  });

  it("eval summary panel renders grade", () => {
    expect(renderEvalSummaryPanel(dashboard.evalSummary)).toContain("pass");
  });

  it("policy gate panel shows blockers", () => {
    expect(renderPolicyGatePanel(dashboard.policyGateSummary)).toContain("Provider egress blocked");
  });

  it("runtime safety panel shows false flags", () => {
    expect(renderRuntimeSafetyPanel(dashboard.runtimeSafety)).toContain("Real calls");
    expect(renderRuntimeSafetyPanel(dashboard.runtimeSafety)).toContain("no");
  });

  it("disabled controls panel shows disabled buttons", () => {
    const html = renderDisabledControlsPanel();
    expect(html).toContain("disabled");
    expect(html).toContain("Real call dispatch");
  });

  it("disabled controls have no dangerous handler", () => {
    expect(renderDisabledControlsPanel()).not.toMatch(/onclick|fetch|submit/iu);
  });

  it("dashboard shell renders all panels", () => {
    const html = renderDashboardShell(dashboard);
    expect(html).toContain("Metrics snapshot");
    expect(html).toContain("Audit preview");
  });
});
