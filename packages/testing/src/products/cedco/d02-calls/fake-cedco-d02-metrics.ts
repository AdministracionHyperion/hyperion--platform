import type {
  CedcoD02Metric,
  CedcoD02MetricsPort,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class FakeCedcoD02Metrics implements CedcoD02MetricsPort {
  private readonly metrics: CedcoD02Metric[] = [];

  async record(metric: CedcoD02Metric): Promise<void> {
    this.metrics.push(metric);
  }

  async summarizeByTenant(tenantId: string): Promise<readonly CedcoD02Metric[]> {
    return this.metrics.filter((metric) => metric.tenantId === tenantId);
  }
}
