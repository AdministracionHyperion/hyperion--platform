import type { CallContext } from "./call-context";
import type { CallObjective } from "./call-objective";

export interface IntentEngineInput {
  readonly textRedacted: string;
  readonly context: CallContext;
}

export interface IntentEngineResult {
  readonly objective: CallObjective;
  readonly confidence: number;
  readonly shouldHandoff?: boolean;
}

export interface IntentEnginePort {
  detectIntent(input: IntentEngineInput): Promise<IntentEngineResult>;
}
