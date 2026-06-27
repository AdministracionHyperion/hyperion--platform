import { metricNames, type MetricsRegistryPort } from "../../../../packages/observability/src";
import type { JobAttempt } from "./job-attempt";
import type { JobEnvelope } from "./job-envelope";
import { updateJobEnvelope } from "./job-envelope";
import type { JobError } from "./job-error";
import type { JobDequeueFilter, JobQueuePort } from "./job-queue.port";
import type { JobResult } from "./job-result";
import type { JobStatus } from "./job-status";

export class InMemoryJobQueue implements JobQueuePort {
  private readonly jobs = new Map<string, JobEnvelope>();
  private readonly order: string[] = [];

  constructor(private readonly metrics?: MetricsRegistryPort) {}

  async enqueue(job: JobEnvelope): Promise<JobEnvelope> {
    const existing = this.jobs.get(job.jobId);
    if (!existing) {
      this.order.push(job.jobId);
    }
    this.jobs.set(job.jobId, job);
    this.metrics?.increment(metricNames.workerJobsEnqueuedTotal, { jobType: job.type });
    return job;
  }

  async dequeue(filter: JobDequeueFilter = {}): Promise<JobEnvelope | undefined> {
    const status = filter.status ?? "queued";
    const now = Date.now();
    const id = this.order.find((jobId) => {
      const job = this.jobs.get(jobId);
      return job?.status === status && (!job.scheduledAt || job.scheduledAt.getTime() <= now);
    });
    return id ? this.jobs.get(id) : undefined;
  }

  async markRunning(jobId: string): Promise<JobEnvelope | undefined> {
    return this.update(jobId, "running", "running");
  }

  async markSucceeded(jobId: string, _result: JobResult): Promise<JobEnvelope | undefined> {
    return this.update(jobId, "succeeded", "succeeded");
  }

  async markFailed(jobId: string, error: JobError): Promise<JobEnvelope | undefined> {
    return this.update(jobId, "failed", "failed", error.code);
  }

  async markDeadLettered(jobId: string, error: JobError): Promise<JobEnvelope | undefined> {
    return this.update(jobId, "dead_lettered", "failed", error.code);
  }

  async markBlocked(jobId: string, error: JobError): Promise<JobEnvelope | undefined> {
    return this.update(jobId, "blocked", "blocked", error.code);
  }

  async requeue(jobId: string): Promise<JobEnvelope | undefined> {
    return this.update(jobId, "queued");
  }

  async findById(jobId: string): Promise<JobEnvelope | undefined> {
    return this.jobs.get(jobId);
  }

  async listByStatus(status: JobStatus): Promise<readonly JobEnvelope[]> {
    return [...this.jobs.values()].filter((job) => job.status === status);
  }

  async clear(): Promise<void> {
    this.jobs.clear();
    this.order.length = 0;
  }

  private update(
    jobId: string,
    status: JobStatus,
    attemptStatus?: JobAttempt["status"],
    errorCode?: string,
  ): JobEnvelope | undefined {
    const job = this.jobs.get(jobId);
    if (!job) {
      return undefined;
    }

    const attempts =
      attemptStatus === undefined
        ? job.attempts
        : appendAttempt(job.attempts, attemptStatus, errorCode);
    const updated = updateJobEnvelope(job, { status, attempts });
    this.jobs.set(jobId, updated);
    return updated;
  }
}

function appendAttempt(
  attempts: readonly JobAttempt[],
  status: JobAttempt["status"],
  errorCode?: string,
): readonly JobAttempt[] {
  const attemptNumber = attempts.length + 1;
  const now = new Date();
  return [
    ...attempts,
    {
      attemptNumber,
      startedAt: now,
      finishedAt: status === "running" ? undefined : now,
      status,
      errorCode,
    },
  ];
}
