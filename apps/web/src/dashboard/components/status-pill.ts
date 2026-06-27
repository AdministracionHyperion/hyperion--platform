import type { DashboardStatus } from "../../../../../modules/core/operations-dashboard/src";
import { escapeHtml } from "./utils";

export function renderStatusPill(status: DashboardStatus): string {
  return `<span class="status-pill status-pill--${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}
