import type { DashboardEvalSummary } from "../operational-dashboard-types";
import { escapeHtml } from "./utils";

export function renderEvalSummaryPanel(summary: DashboardEvalSummary): string {
  return `<section class="panel">
    <h2>CEDCO D02 evals</h2>
    <dl class="kv-grid">
      <dt>Suite</dt><dd>${escapeHtml(summary.suiteName)}</dd>
      <dt>Grade</dt><dd>${escapeHtml(summary.grade)}</dd>
      <dt>Score</dt><dd>${escapeHtml(summary.weightedPercentage)}%</dd>
      <dt>Cases</dt><dd>${summary.passed}/${summary.totalCases}</dd>
      <dt>Critical failures</dt><dd>${summary.criticalFailed}</dd>
      <dt>Run</dt><dd>${escapeHtml(summary.lastRunLabel)}</dd>
    </dl>
  </section>`;
}
