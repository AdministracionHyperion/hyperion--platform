import { describe, expect, it } from "vitest";
import { InMemoryLogger, metricNames } from "../../../../packages/observability/src";
import {
  createJobEnvelope,
  createJobError,
  createJobId,
  createJobSuccess,
  InMemoryDeadLetterQueue,
  InMemoryJobQueue,
  JobRegistry,
  RetryPolicy,
  WorkerRunner,
  type JobEnvelope,
  type JobHandlerPort,
  type JobType,
  type WorkerContext,
} from "../core";
import { createFakeWorkerServices } from "../composition";
import { createWorkerApp } from "../worker-app";

describe("worker core", () => {
  it("rejects invalid JobId values", () => {
    expect(createJobId("job-001").ok).toBe(true);
    expect(createJobId("Job 001").ok).toBe(false);
  });

  it("enqueues and dequeues jobs in memory", async () => {
    const services = createFakeWorkerServices();
    const queue = new InMemoryJobQueue(services.metrics);
    const job = jobFixture("job-queue-001", "outbox.process");

    await queue.enqueue(job);

    expect(await queue.dequeue()).toMatchObject({ jobId: job.jobId, status: "queued" });
    expect(
      services.metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.workerJobsEnqueuedTotal),
    ).toBe(true);
  });

  it("tracks queued, running, and succeeded statuses", async () => {
    const queue = new InMemoryJobQueue();
    const job = jobFixture("job-status-001", "outbox.process");
    await queue.enqueue(job);
    await queue.markRunning(job.jobId);
    expect(await queue.listByStatus("running")).toHaveLength(1);
    await queue.markSucceeded(job.jobId, createJobSuccess({ jobId: job.jobId }));
    expect(await queue.listByStatus("succeeded")).toHaveLength(1);
  });

  it("stores failed jobs in the dead-letter queue", async () => {
    const deadLetters = new InMemoryDeadLetterQueue();
    const job = jobFixture("job-dead-letter-001", "outbox.process");
    const error = createJobError({ code: "failed", message: "failed", retryable: false });

    await deadLetters.add(job, error);

    expect(await deadLetters.list()).toHaveLength(1);
  });

  it("resolves registered handlers by type", () => {
    const registry = new JobRegistry();
    registry.register(successHandler("outbox.process"));
    expect(registry.resolve("outbox.process").canHandle("outbox.process")).toBe(true);
  });

  it("fails when no handler is registered", () => {
    const registry = new JobRegistry();
    expect(() => registry.resolve("outbox.process")).toThrow("No worker job handler");
  });

  it("calculates retry allowance up to maxAttempts", () => {
    const retry = new RetryPolicy({ maxAttempts: 2, backoff: "linear", baseDelayMs: 10 });
    const error = createJobError({ code: "retryable", message: "retry", retryable: true });

    expect(retry.shouldRetry(error, 1)).toBe(true);
    expect(retry.shouldRetry(error, 2)).toBe(false);
    expect(retry.nextDelayMs(2)).toBe(20);
  });

  it("sends retry-exhausted failures to dead-letter", async () => {
    const services = createFakeWorkerServices();
    const queue = new InMemoryJobQueue(services.metrics);
    const deadLetterQueue = new InMemoryDeadLetterQueue();
    const registry = new JobRegistry();
    registry.register(failingHandler("outbox.process"));
    const runner = new WorkerRunner({
      queue,
      deadLetterQueue,
      registry,
      baseContext: baseContext(services),
      retryPolicy: new RetryPolicy({ maxAttempts: 1 }),
    });
    await queue.enqueue(jobFixture("job-retry-001", "outbox.process", { maxAttempts: 1 }));

    await runner.processNext();

    expect(await deadLetterQueue.list()).toHaveLength(1);
    expect(await queue.listByStatus("dead_lettered")).toHaveLength(1);
  });

  it("does not execute a succeeded job twice", async () => {
    const app = createWorkerApp();
    const job = jobFixture("job-idempotent-001", "outbox.process");
    await app.queue.enqueue(job);
    await app.runner.processNext();
    await app.queue.requeue(job.jobId);

    const second = await app.runner.processNext();

    expect(second?.output).toMatchObject({ idempotent: true });
  });

  it("processNext executes one safe job", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(jobFixture("job-process-001", "outbox.process"));

    const result = await app.runner.processNext();

    expect(result?.success).toBe(true);
    expect(await app.queue.listByStatus("succeeded")).toHaveLength(1);
  });

  it("processAll respects maxJobs", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(jobFixture("job-all-001", "outbox.process"));
    await app.queue.enqueue(jobFixture("job-all-002", "outbox.process"));

    const results = await app.runner.processAll(1);

    expect(results).toHaveLength(1);
    expect(await app.queue.listByStatus("queued")).toHaveLength(1);
  });

  it("processAll stops when the bounded queue is empty", async () => {
    const app = createWorkerApp();
    const results = await app.runner.processAll(3);
    expect(results).toHaveLength(0);
  });

  it("records worker metrics and sanitized logs", async () => {
    const services = createFakeWorkerServices();
    const app = createWorkerApp({ services });
    await app.queue.enqueue(
      jobFixture("job-observe-001", "outbox.process", {
        payload: { email: "synthetic@example.invalid" },
      }),
    );

    await app.runner.processNext();

    expect(
      services.metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.workerJobsSucceededTotal),
    ).toBe(true);
    expect(JSON.stringify((services.logger as InMemoryLogger).getEntries())).not.toContain(
      "synthetic@example.invalid",
    );
  });

  it("preserves correlationId in logs", async () => {
    const services = createFakeWorkerServices();
    const app = createWorkerApp({ services });
    await app.queue.enqueue(jobFixture("job-correlation-001", "outbox.process"));

    await app.runner.processNext();

    expect(
      (services.logger as InMemoryLogger)
        .getEntries()
        .some((entry) => entry.correlationId === "corr-worker-001"),
    ).toBe(true);
  });
});

function jobFixture(
  jobIdValue: string,
  type: JobType,
  options: {
    readonly payload?: Readonly<Record<string, unknown>>;
    readonly maxAttempts?: number;
  } = {},
): JobEnvelope {
  const jobId = createJobId(jobIdValue);
  if (!jobId.ok) {
    throw new Error("invalid test job id");
  }

  return createJobEnvelope({
    jobId: jobId.value,
    type,
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-worker-001",
    payload: options.payload,
    maxAttempts: options.maxAttempts,
  });
}

function successHandler(type: JobType): JobHandlerPort {
  return {
    canHandle(candidate: JobType): boolean {
      return candidate === type;
    },
    async handle(job: JobEnvelope, _context: WorkerContext) {
      return createJobSuccess({ jobId: job.jobId });
    },
  };
}

function failingHandler(type: JobType): JobHandlerPort {
  return {
    canHandle(candidate: JobType): boolean {
      return candidate === type;
    },
    async handle() {
      throw new Error("retryable failure");
    },
  };
}

function baseContext(services: ReturnType<typeof createFakeWorkerServices>) {
  return {
    logger: services.logger,
    metrics: services.metrics,
    runtimeSafetyFlags: services.runtimeSafetyFlags,
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    services,
  };
}
