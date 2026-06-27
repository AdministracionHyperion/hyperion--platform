import { metricNames } from "../../../../packages/observability/src";
import { createOperationContext } from "../../../../packages/shared/src/core";
import { createJobError } from "./job-error";
import { createJobFailure, createJobSuccess, type JobResult } from "./job-result";
import type { DeadLetterQueuePort } from "./dead-letter-queue.port";
import type { JobQueuePort } from "./job-queue.port";
import type { JobRegistry } from "./job-registry";
import { IdempotencyPolicy } from "./idempotency-policy";
import { RetryPolicy } from "./retry-policy";
import { evaluateWorkerRuntimeSafety } from "./worker-runtime-safety";
import type { WorkerContext } from "./worker-context";

export interface WorkerRunnerInput {
  readonly queue: JobQueuePort;
  readonly deadLetterQueue: DeadLetterQueuePort;
  readonly registry: JobRegistry;
  readonly baseContext: Omit<WorkerContext, "operationContext" | "actor">;
  readonly retryPolicy?: RetryPolicy;
  readonly idempotencyPolicy?: IdempotencyPolicy;
}

export class WorkerRunner {
  private readonly retryPolicy: RetryPolicy;
  private readonly idempotencyPolicy: IdempotencyPolicy;

  constructor(private readonly input: WorkerRunnerInput) {
    this.retryPolicy = input.retryPolicy ?? new RetryPolicy();
    this.idempotencyPolicy = input.idempotencyPolicy ?? new IdempotencyPolicy();
  }

  async processNext(): Promise<JobResult | undefined> {
    const job = await this.input.queue.dequeue({ status: "queued" });
    if (!job) {
      return undefined;
    }

    if (this.idempotencyPolicy.hasSucceeded(job)) {
      return createJobSuccess({
        jobId: job.jobId,
        output: { idempotent: true },
        metadata: { jobType: job.type },
      });
    }

    const contextResult = createOperationContext({
      tenantId: job.tenantId,
      actorId: job.actorId ?? "worker-system",
      correlationId: job.correlationId,
      source: "worker",
      occurredAt: this.input.baseContext.now(),
    });
    if (!contextResult.ok) {
      const error = createJobError({
        code: contextResult.error.code,
        message: contextResult.error.message,
        retryable: false,
      });
      await this.input.queue.markBlocked(job.jobId, error);
      return createJobFailure({ jobId: job.jobId, status: "blocked", error });
    }

    const actor = {
      actorId: (job.actorId ?? "worker-system") as WorkerContext["actor"]["actorId"],
      tenantId: job.tenantId,
      roles: ["super-admin"] as const,
    };
    const context: WorkerContext = {
      ...this.input.baseContext,
      operationContext: contextResult.value,
      actor,
    };

    const safety = evaluateWorkerRuntimeSafety({
      job,
      context: context.operationContext,
      actor,
      flags: context.runtimeSafetyFlags,
      logger: context.logger,
      metrics: context.metrics,
    });
    if (!safety.allowed) {
      const error = createJobError({
        code: "worker_policy_blocked",
        message: "worker job blocked by policy gate",
        retryable: false,
        metadata: { reasons: safety.reasons },
      });
      await this.input.queue.markBlocked(job.jobId, error);
      context.metrics.increment(metricNames.workerJobsBlockedTotal, { jobType: job.type });
      return createJobFailure({ jobId: job.jobId, status: "blocked", error });
    }

    if (!this.idempotencyPolicy.tryStart(job)) {
      return createJobSuccess({
        jobId: job.jobId,
        output: { idempotent: true },
        metadata: { jobType: job.type },
      });
    }

    const startedAt = Date.now();
    context.metrics.increment(metricNames.workerJobsStartedTotal, { jobType: job.type });
    context.logger.info({
      message: "worker.job.started",
      eventName: "worker.job.started",
      tenantId: job.tenantId,
      actorId: job.actorId,
      correlationId: job.correlationId,
      metadata: { jobId: job.jobId, jobType: job.type },
    });
    await this.input.queue.markRunning(job.jobId);

    try {
      const handler = this.input.registry.resolve(job.type);
      const result = await handler.handle(job, context);
      await this.input.queue.markSucceeded(job.jobId, result);
      this.idempotencyPolicy.markSucceeded(job);
      context.metrics.increment(metricNames.workerJobsSucceededTotal, { jobType: job.type });
      context.metrics.observe(metricNames.workerJobDurationMs, Date.now() - startedAt, {
        jobType: job.type,
      });
      context.logger.info({
        message: "worker.job.succeeded",
        eventName: "worker.job.succeeded",
        tenantId: job.tenantId,
        actorId: job.actorId,
        correlationId: job.correlationId,
        metadata: { jobId: job.jobId, jobType: job.type },
      });
      return result;
    } catch (unknownError) {
      const error = normalizeError(unknownError);
      await this.handleFailure(job.jobId, job.type, error, job.attempts.length + 1, context);
      return createJobFailure({ jobId: job.jobId, error });
    } finally {
      this.idempotencyPolicy.markFinished(job);
    }
  }

  async processAll(maxJobs = 100): Promise<readonly JobResult[]> {
    const results: JobResult[] = [];
    for (let index = 0; index < maxJobs; index += 1) {
      const result = await this.processNext();
      if (!result) {
        break;
      }
      results.push(result);
    }
    return results;
  }

  private async handleFailure(
    jobId: string,
    jobType: string,
    error: ReturnType<typeof normalizeError>,
    completedAttempts: number,
    context: WorkerContext,
  ): Promise<void> {
    context.metrics.increment(metricNames.workerJobsFailedTotal, { jobType });
    context.logger.warn({
      message: "worker.job.failed",
      eventName: "worker.job.failed",
      tenantId: context.operationContext.tenantId,
      actorId: context.operationContext.actorId,
      correlationId: context.operationContext.correlationId,
      metadata: { jobId, jobType, errorCode: error.code },
    });

    const failed = await this.input.queue.markFailed(jobId, error);
    if (!failed) {
      return;
    }

    if (
      this.retryPolicy.shouldRetry(error, completedAttempts) &&
      completedAttempts < failed.maxAttempts
    ) {
      await this.input.queue.requeue(jobId);
      return;
    }

    await this.input.queue.markDeadLettered(jobId, error);
    await this.input.deadLetterQueue.add(failed, error);
    context.metrics.increment(metricNames.workerJobsDeadLetteredTotal, { jobType });
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return createJobError({
      code: "worker_job_failed",
      message: error.message,
      retryable: true,
    });
  }

  return createJobError({
    code: "worker_job_failed",
    message: "worker job failed",
    retryable: true,
  });
}
