import type { DialerHardeningChecklistItem } from "./dialer-hardening-checklist";

export interface DialerReadinessScore {
  readonly total: number;
  readonly complete: number;
  readonly percentage: number;
  readonly grade: "blocked" | "warning" | "ready";
}

export function scoreDialerReadiness(
  checklist: readonly DialerHardeningChecklistItem[],
): DialerReadinessScore {
  const total = checklist.length;
  const complete = checklist.filter((item) => item.complete).length;
  const percentage = total === 0 ? 0 : Math.round((complete / total) * 100);

  return {
    total,
    complete,
    percentage,
    grade: percentage === 100 ? "ready" : complete > 0 ? "warning" : "blocked",
  };
}
