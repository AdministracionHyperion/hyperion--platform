export interface LatencyBudget {
  readonly targetMs: number;
  readonly maxMs: number;
  readonly criticalMs: number;
}
