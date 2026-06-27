import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { HandoffPriority } from "./handoff-priority";
import type { HandoffRuleId } from "./handoff-id";
import type { HandoffTrigger } from "./handoff-trigger";

export interface HandoffRule {
  readonly handoffRuleId: HandoffRuleId;
  readonly tenantId: string;
  readonly name: string;
  readonly trigger: HandoffTrigger;
  readonly priority: HandoffPriority;
  readonly targetQueue: string;
  readonly enabled: boolean;
  readonly metadata: SafeMetadata;
}
