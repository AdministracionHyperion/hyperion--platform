import type { OperationalDashboardReadModel } from "../operational-dashboard-types";
import { renderAuditPreviewPanel } from "./audit-preview-panel";
import { renderDisabledControlsPanel } from "./disabled-controls-panel";
import { renderEvalSummaryPanel } from "./eval-summary-panel";
import { renderMetricsPanel } from "./metrics-panel";
import { renderMockCallFlowTable } from "./mock-call-flow-table";
import { renderPolicyGatePanel } from "./policy-gate-panel";
import { renderProviderEventTable } from "./provider-event-table";
import { renderRuntimeSafetyPanel } from "./runtime-safety-panel";
import { renderSummaryCard } from "./summary-card";
import { renderStatusPill } from "./status-pill";
import { escapeHtml } from "./utils";

export function renderDashboardShell(model: OperationalDashboardReadModel): string {
  return `<main class="dashboard-shell">
    <aside class="dashboard-shell__sidebar">
      <strong>Hyperion</strong>
      <nav>Operations</nav>
    </aside>
    <section class="dashboard-shell__content">
      <header class="dashboard-header">
        <div>
          <h1>CEDCO D02 Operations</h1>
          <p>Tenant ${escapeHtml(model.tenantId)} · ${escapeHtml(model.correlationId)}</p>
        </div>
        ${renderStatusPill(model.overallStatus)}
      </header>
      <section class="summary-grid">${model.summaryCards.map(renderSummaryCard).join("")}</section>
      <section class="dashboard-grid">
        ${renderRuntimeSafetyPanel(model.runtimeSafety)}
        ${renderEvalSummaryPanel(model.evalSummary)}
        ${renderPolicyGatePanel(model.policyGateSummary)}
        ${renderDisabledControlsPanel()}
        ${renderMockCallFlowTable(model.mockCallFlows)}
        ${renderProviderEventTable(model.providerEvents)}
        ${renderAuditPreviewPanel(model.auditPreview)}
        ${renderMetricsPanel(model.metricsSnapshot)}
      </section>
    </section>
  </main>`;
}
