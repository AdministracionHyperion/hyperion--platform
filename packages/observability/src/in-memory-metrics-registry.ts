import type {
  MetricLabels,
  MetricCounterSnapshot,
  MetricObservationSnapshot,
  MetricsRegistryPort,
  MetricsSnapshot,
} from "./metric-types";

export class InMemoryMetricsRegistry implements MetricsRegistryPort {
  private readonly counters = new Map<string, MetricCounterSnapshot>();
  private readonly observations = new Map<
    string,
    { name: string; labels: MetricLabels; values: number[] }
  >();

  increment(name: string, labels: MetricLabels = {}, value = 1): void {
    const key = metricKey(name, labels);
    const current = this.counters.get(key);
    this.counters.set(key, {
      name,
      labels,
      value: (current?.value ?? 0) + value,
    });
  }

  observe(name: string, value: number, labels: MetricLabels = {}): void {
    const key = metricKey(name, labels);
    const current = this.observations.get(key) ?? { name, labels, values: [] };
    current.values.push(value);
    this.observations.set(key, current);
  }

  snapshot(): MetricsSnapshot {
    return {
      counters: [...this.counters.values()],
      observations: [...this.observations.values()].map(
        (observation): MetricObservationSnapshot => ({
          name: observation.name,
          labels: observation.labels,
          values: [...observation.values],
          count: observation.values.length,
        }),
      ),
    };
  }

  clear(): void {
    this.counters.clear();
    this.observations.clear();
  }
}

function metricKey(name: string, labels: MetricLabels): string {
  return JSON.stringify({
    name,
    labels: Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)),
  });
}
