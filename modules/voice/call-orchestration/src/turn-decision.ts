import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { TurnAction } from "./turn-action";

export interface TurnDecision {
  readonly action: TurnAction;
  readonly responseTextRedacted?: string;
  readonly toolName?: string;
  readonly handoffReason?: string;
  readonly metadata: SafeMetadata;
}
