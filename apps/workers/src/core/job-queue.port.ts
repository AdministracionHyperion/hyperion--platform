import type { JobEnvelope } from "./job-envelope";
import type { JobError } from "./job-error";
import type { JobResult } from "./job-result";
import type { JobStatus } from "./job-status";

export interface JobDequeueFilter {
  readonly status?: JobStatus;
}

export interface JobQueuePort {
  enqueue(job: JobEnvelope): Promise<JobEnvelope>;
  dequeue(filter?: JobDequeueFilter): Promise<JobEnvelope | undefined>;
  markRunning(jobId: string): Promise<JobEnvelope | undefined>;
  markSucceeded(jobId: string, result: JobResult): Promise<JobEnvelope | undefined>;
  markFailed(jobId: string, error: JobError): Promise<JobEnvelope | undefined>;
  markDeadLettered(jobId: string, error: JobError): Promise<JobEnvelope | undefined>;
  markBlocked(jobId: string, error: JobError): Promise<JobEnvelope | undefined>;
  requeue(jobId: string): Promise<JobEnvelope | undefined>;
  findById(jobId: string): Promise<JobEnvelope | undefined>;
  listByStatus(status: JobStatus): Promise<readonly JobEnvelope[]>;
  clear(): Promise<void>;
}
