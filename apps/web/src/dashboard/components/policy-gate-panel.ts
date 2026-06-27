import type { DashboardPolicyGateSummary } from "../operational-dashboard-types";
import { escapeHtml, renderBoolean } from "./utils";

export function renderPolicyGatePanel(summary: DashboardPolicyGateSummary): string {
  return `<section class="panel">
    <h2>Policy gates</h2>
    <dl class="kv-grid">
      <dt>Denied total</dt><dd>${summary.deniedTotal}</dd>
      <dt>Real calls blocked</dt><dd>${renderBoolean(summary.realCallsBlocked)}</dd>
      <dt>Provider egress blocked</dt><dd>${renderBoolean(summary.providerEgressBlocked)}</dd>
      <dt>Raw text blocked</dt><dd>${renderBoolean(summary.rawTextBlocked)}</dd>
      <dt>Raw recording blocked</dt><dd>${renderBoolean(summary.rawRecordingBlocked)}</dd>
      <dt>Data export blocked</dt><dd>${renderBoolean(summary.dataExportBlocked)}</dd>
    </dl>
    <p>${escapeHtml(summary.topDeniedReasons.join(", ") || "No recent denials.")}</p>
  </section>`;
}
