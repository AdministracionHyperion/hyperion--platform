import { InMemoryDeadLetterQueue, InMemoryJobQueue, WorkerRunner } from "./core";
import { createFakeWorkerServices, createWorkerRegistry, type WorkerServices } from "./composition";
import { createWorkerConfig, type WorkerConfig } from "./worker-config";

export interface WorkerApp {
  readonly config: WorkerConfig;
  readonly services: WorkerServices;
  readonly queue: InMemoryJobQueue;
  readonly deadLetterQueue: InMemoryDeadLetterQueue;
  readonly registry: ReturnType<typeof createWorkerRegistry>;
  readonly runner: WorkerRunner;
}

export function createWorkerApp(
  input: {
    readonly config?: Partial<WorkerConfig>;
    readonly services?: WorkerServices;
  } = {},
): WorkerApp {
  const config = createWorkerConfig(input.config);
  const services = input.services ?? createFakeWorkerServices();
  const queue = new InMemoryJobQueue(services.metrics);
  const deadLetterQueue = new InMemoryDeadLetterQueue();
  const registry = createWorkerRegistry();
  const runner = new WorkerRunner({
    queue,
    deadLetterQueue,
    registry,
    baseContext: {
      logger: services.logger,
      metrics: services.metrics,
      runtimeSafetyFlags: services.runtimeSafetyFlags,
      now: () => new Date(),
      services,
    },
  });

  return {
    config,
    services,
    queue,
    deadLetterQueue,
    registry,
    runner,
  };
}
