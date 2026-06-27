import type { DashboardMetric } from "../operational-dashboard-types";
import { escapeHtml } from "./utils";

export function renderMetricsPanel(metrics: readonly DashboardMetric[]): string {
  return `<section class="panel">
    <h2>Metrics snapshot</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th><th>Labels</th></tr></thead>
      <tbody>${metrics
        .map(
          (metric) => `<tr>
            <td>${escapeHtml(metric.metricName)}</td>
            <td>${metric.value}</td>
            <td>${escapeHtml(JSON.stringify(metric.labels))}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}
