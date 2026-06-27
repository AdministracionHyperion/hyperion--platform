import type { DashboardAuditPreview } from "../operational-dashboard-types";
import { escapeHtml } from "./utils";

export function renderAuditPreviewPanel(events: readonly DashboardAuditPreview[]): string {
  return `<section class="panel">
    <h2>Audit preview</h2>
    <table>
      <thead><tr><th>Action</th><th>Severity</th><th>Correlation</th><th>Time</th></tr></thead>
      <tbody>${events
        .map(
          (event) => `<tr>
            <td>${escapeHtml(event.action)}</td>
            <td>${escapeHtml(event.severity)}</td>
            <td>${escapeHtml(event.correlationId)}</td>
            <td>${escapeHtml(event.occurredAt)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}
