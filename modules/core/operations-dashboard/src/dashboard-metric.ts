export interface DashboardMetric {
  readonly metricName: string;
  readonly value: number;
  readonly labels: Readonly<Record<string, string>>;
}
