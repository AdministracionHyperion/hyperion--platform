import type { SafeMetadata } from "../../../../../packages/shared/src/core";

export interface CedcoD02Metric {
  readonly metricId: string;
  readonly tenantId: string;
  readonly key: string;
  readonly value: number;
  readonly dimensions: SafeMetadata;
  readonly occurredAt: Date;
}
