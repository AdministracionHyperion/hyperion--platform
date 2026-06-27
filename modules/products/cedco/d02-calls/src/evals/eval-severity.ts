export const cedcoD02EvalSeverities = ["info", "warning", "high", "critical"] as const;

export type CedcoD02EvalCaseSeverity = (typeof cedcoD02EvalSeverities)[number];

export function severityWeight(severity: CedcoD02EvalCaseSeverity): number {
  switch (severity) {
    case "info":
      return 1;
    case "warning":
      return 2;
    case "high":
      return 4;
    case "critical":
      return 8;
  }
}
