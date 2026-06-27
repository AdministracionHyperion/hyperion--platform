import type { CedcoD02Metric } from "./cedco-d02-metric";

export interface CedcoD02MetricsPort {
  record(metric: CedcoD02Metric): Promise<void>;
  summarizeByTenant(tenantId: string): Promise<readonly CedcoD02Metric[]>;
}
