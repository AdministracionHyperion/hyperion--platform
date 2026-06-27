import type { ActorContext } from "../../../../modules/core/identity-access/src";
import type { RuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";
import type { OperationContext } from "../../../../packages/shared/src/core";
import type { LoggerPort, MetricsRegistryPort } from "../../../../packages/observability/src";

export interface WorkerContext {
  readonly operationContext: OperationContext;
  readonly actor: ActorContext;
  readonly logger: LoggerPort;
  readonly metrics: MetricsRegistryPort;
  readonly runtimeSafetyFlags: RuntimeSafetyFlags;
  readonly now: () => Date;
  readonly services: unknown;
}
