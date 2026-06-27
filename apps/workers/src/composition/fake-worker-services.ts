import {
  defaultRuntimeSafetyFlags,
  type RuntimeSafetyFlags,
} from "../../../../modules/core/policy-gates/src";
import { MockCallRuntimeAdapter } from "../../../../modules/voice/call-runtime/src";
import { InMemoryLogger, InMemoryMetricsRegistry } from "../../../../packages/observability/src";
import type { CedcoD02Metric } from "../../../../modules/products/cedco/d02-calls/src";
import type { WorkerServices } from "./worker-services";

export interface FakeWorkerServicesInput {
  readonly runtimeSafetyFlags?: Partial<RuntimeSafetyFlags>;
}

export function createFakeWorkerServices(input: FakeWorkerServicesInput = {}): WorkerServices {
  const logger = new InMemoryLogger();
  const metrics = new InMemoryMetricsRegistry();
  const cedcoMetrics = new InMemoryCedcoD02WorkerMetrics();
  const mockCallRuntime = new MockCallRuntimeAdapter();

  return {
    logger,
    metrics,
    mockCallRuntime,
    runtimeSafetyFlags: {
      ...defaultRuntimeSafetyFlags,
      workerRuntimeEnabled: true,
      ...input.runtimeSafetyFlags,
    },
    cedcoD02Metrics: cedcoMetrics,
    recordedMetrics: () => cedcoMetrics.list(),
  };
}

class InMemoryCedcoD02WorkerMetrics {
  private readonly metrics: CedcoD02Metric[] = [];

  async record(metric: CedcoD02Metric): Promise<void> {
    this.metrics.push(metric);
  }

  async summarizeByTenant(tenantId: string): Promise<readonly CedcoD02Metric[]> {
    return this.metrics.filter((metric) => metric.tenantId === tenantId);
  }

  list(): readonly CedcoD02Metric[] {
    return [...this.metrics];
  }
}
