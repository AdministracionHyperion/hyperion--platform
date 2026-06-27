export interface WorkerConfig {
  readonly maxJobsPerRun: number;
  readonly runtimeMode: "test" | "manual";
}

export function createWorkerConfig(input: Partial<WorkerConfig> = {}): WorkerConfig {
  return {
    maxJobsPerRun: input.maxJobsPerRun ?? 100,
    runtimeMode: input.runtimeMode ?? "manual",
  };
}
