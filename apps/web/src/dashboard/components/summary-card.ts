import type { DashboardCard } from "../operational-dashboard-types";
import { renderStatusPill } from "./status-pill";
import { escapeHtml } from "./utils";

export function renderSummaryCard(card: DashboardCard): string {
  return `<article class="summary-card">
    <div class="summary-card__header">
      <span>${escapeHtml(card.label)}</span>
      ${renderStatusPill(card.status)}
    </div>
    <strong>${escapeHtml(card.value)}</strong>
    <small>${escapeHtml(card.helperText)}</small>
  </article>`;
}
