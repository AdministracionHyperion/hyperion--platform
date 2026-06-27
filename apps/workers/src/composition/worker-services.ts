import type {
  CedcoD02Metric,
  CedcoD02MetricsPort,
} from "../../../../modules/products/cedco/d02-calls/src";
import type { RuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";
import type { LoggerPort, MetricsRegistryPort } from "../../../../packages/observability/src";

export interface WorkerServices {
  readonly logger: LoggerPort;
  readonly metrics: MetricsRegistryPort;
  readonly runtimeSafetyFlags: RuntimeSafetyFlags;
  readonly cedcoD02Metrics: CedcoD02MetricsPort;
  readonly recordedMetrics?: () => readonly CedcoD02Metric[];
}
