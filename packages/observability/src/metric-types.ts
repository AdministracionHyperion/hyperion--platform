export type MetricLabels = Readonly<Record<string, string>>;

export interface MetricCounterSnapshot {
  readonly name: string;
  readonly labels: MetricLabels;
  readonly value: number;
}

export interface MetricObservationSnapshot {
  readonly name: string;
  readonly labels: MetricLabels;
  readonly values: readonly number[];
  readonly count: number;
}

export interface MetricsSnapshot {
  readonly counters: readonly MetricCounterSnapshot[];
  readonly observations: readonly MetricObservationSnapshot[];
}

export interface MetricsRegistryPort {
  increment(name: string, labels?: MetricLabels, value?: number): void;
  observe(name: string, value: number, labels?: MetricLabels): void;
  snapshot(): MetricsSnapshot;
  clear(): void;
}
