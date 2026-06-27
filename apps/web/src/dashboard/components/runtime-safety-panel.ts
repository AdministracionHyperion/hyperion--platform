import type { DashboardRuntimeSafety } from "../operational-dashboard-types";
import { escapeHtml, renderBoolean } from "./utils";

export function renderRuntimeSafetyPanel(safety: DashboardRuntimeSafety): string {
  return `<section class="panel">
    <h2>Runtime safety</h2>
    <dl class="kv-grid">
      <dt>Real calls</dt><dd>${renderBoolean(safety.realCallsEnabled)}</dd>
      <dt>Provider egress</dt><dd>${renderBoolean(safety.providerEgressEnabled)}</dd>
      <dt>Production deploy</dt><dd>${renderBoolean(safety.productionDeployEnabled)}</dd>
      <dt>Raw text</dt><dd>${renderBoolean(safety.rawTextEnabled)}</dd>
      <dt>Raw recording</dt><dd>${renderBoolean(safety.rawRecordingEnabled)}</dd>
      <dt>Data export</dt><dd>${renderBoolean(safety.dataExportEnabled)}</dd>
      <dt>Workers</dt><dd>${escapeHtml(safety.workerRuntimeEnabled)}</dd>
    </dl>
    <p>${escapeHtml(safety.explanation)}</p>
  </section>`;
}
