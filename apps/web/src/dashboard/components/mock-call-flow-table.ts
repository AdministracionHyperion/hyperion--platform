import type { DashboardMockCallFlow } from "../operational-dashboard-types";
import { escapeHtml, renderBoolean } from "./utils";

export function renderMockCallFlowTable(flows: readonly DashboardMockCallFlow[]): string {
  return `<section class="panel">
    <h2>Mock call flows</h2>
    <table>
      <thead><tr><th>Flow</th><th>Session</th><th>Provider ref</th><th>Status</th><th>Handoff</th></tr></thead>
      <tbody>${flows
        .map(
          (flow) => `<tr>
            <td>${escapeHtml(flow.flowId)}</td>
            <td>${escapeHtml(flow.sessionId)}</td>
            <td>${escapeHtml(flow.providerCallRef)}</td>
            <td>${escapeHtml(flow.status)}</td>
            <td>${renderBoolean(flow.handoffRecommended)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}
