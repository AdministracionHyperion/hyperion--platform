import type { DialerHardeningStatus } from "../dialer-hardening-status";
import type { DialerHardeningChecklistItem } from "./dialer-hardening-checklist";
import type { DialerReadinessScore } from "./dialer-readiness-score";

export interface DialerReadinessSummary {
  readonly status: "blocked" | "partial" | "ready";
  readonly p0Complete: boolean;
  readonly dryRunSurfaceAvailable: boolean;
  readonly dispatchAvailable: false;
  readonly blockers: readonly string[];
  readonly nextSafeAction: string;
}

export function summarizeDialerReadiness(input: {
  readonly hardeningStatus: DialerHardeningStatus;
  readonly checklist: readonly DialerHardeningChecklistItem[];
  readonly score: DialerReadinessScore;
}): DialerReadinessSummary {
  const blockers = input.checklist.filter((item) => !item.complete).map((item) => item.label);

  return {
    status: input.hardeningStatus.p0Complete
      ? "ready"
      : input.score.complete > 0
        ? "partial"
        : "blocked",
    p0Complete: input.hardeningStatus.p0Complete,
    dryRunSurfaceAvailable: true,
    dispatchAvailable: false,
    blockers,
    nextSafeAction:
      "Complete the dialer P0 hardening backlog, then review approvals, runbooks, provider configuration and secret manager refs before any future dispatch work.",
  };
}
