import type { CallId } from "../../voice-core/src/call-id";
import type { CallContext } from "./call-context";
import type { CallObjective } from "./call-objective";

export interface CallOrchestrationPlan {
  readonly callId: CallId;
  readonly tenantId: string;
  readonly objective: CallObjective;
  readonly context: CallContext;
  readonly preparedAt: Date;
}
