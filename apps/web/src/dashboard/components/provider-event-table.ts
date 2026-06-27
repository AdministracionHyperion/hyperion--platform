import type { DashboardProviderEvent } from "../operational-dashboard-types";
import { escapeHtml, renderBoolean } from "./utils";

export function renderProviderEventTable(events: readonly DashboardProviderEvent[]): string {
  return `<section class="panel">
    <h2>Mock provider events</h2>
    <table>
      <thead><tr><th>Event</th><th>Provider ref</th><th>Type</th><th>Status</th><th>Replay</th><th>Processed</th></tr></thead>
      <tbody>${events
        .map(
          (event) => `<tr>
            <td>${escapeHtml(event.eventId)}</td>
            <td>${escapeHtml(event.providerCallRef)}</td>
            <td>${escapeHtml(event.type)}</td>
            <td>${escapeHtml(event.status)}</td>
            <td>${renderBoolean(event.replayBlocked)}</td>
            <td>${renderBoolean(event.processed)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}
