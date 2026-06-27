export type InterruptionStrategy = "ignore" | "pause" | "barge_in";

export interface TurnTakingPolicy {
  readonly allowBargeIn: boolean;
  readonly maxSilenceMs: number;
  readonly maxTurnDurationMs: number;
  readonly interruptionStrategy: InterruptionStrategy;
}
