import { escapeHtml } from "./utils";

export interface DialerReadinessPanelModel {
  readonly status: "blocked" | "partial" | "ready";
  readonly p0Complete: boolean;
  readonly blockers: readonly string[];
}

const defaultDialerReadiness: DialerReadinessPanelModel = {
  status: "blocked",
  p0Complete: false,
  blockers: [
    "Idempotency key persisted",
    "Real dry-run supported by dialer",
    "Webhook signature required",
    "JWT auth required",
    "Raw outcome persistence removed",
    "Internal endpoint available",
    "Pending contacts atomic",
    "Retry/DLQ clarified",
  ],
};

export function renderDialerReadinessPanel(
  model: DialerReadinessPanelModel = defaultDialerReadiness,
): string {
  return `<section class="panel dialer-readiness">
    <h2>Dialer readiness</h2>
    <p>Status: <strong>${escapeHtml(model.status)}</strong></p>
    <p>P0 complete: ${model.p0Complete ? "yes" : "no"}</p>
    <ul>
      ${model.blockers.map((blocker) => `<li>${escapeHtml(blocker)}</li>`).join("")}
    </ul>
    <p>Dry-run contract only. Dispatch remains unavailable.</p>
  </section>`;
}
