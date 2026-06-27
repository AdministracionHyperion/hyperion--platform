import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";
import type { JobAttempt } from "./job-attempt";
import type { JobId } from "./job-id";
import type { JobPriority } from "./job-priority";
import type { JobStatus } from "./job-status";
import type { JobType } from "./job-type";

export interface JobEnvelope {
  readonly jobId: JobId;
  readonly type: JobType;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly correlationId: string;
  readonly priority: JobPriority;
  readonly payload: SafeMetadata;
  readonly status: JobStatus;
  readonly attempts: readonly JobAttempt[];
  readonly maxAttempts: number;
  readonly scheduledAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly dedupeKey?: string;
}

export interface CreateJobEnvelopeInput {
  readonly jobId: JobId;
  readonly type: JobType;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly correlationId: string;
  readonly priority?: JobPriority;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly maxAttempts?: number;
  readonly scheduledAt?: Date;
  readonly createdAt?: Date;
  readonly dedupeKey?: string;
}

export function createJobEnvelope(input: CreateJobEnvelopeInput): JobEnvelope {
  const now = input.createdAt ?? new Date();
  return {
    jobId: input.jobId,
    type: input.type,
    tenantId: input.tenantId,
    actorId: input.actorId,
    correlationId: input.correlationId,
    priority: input.priority ?? "normal",
    payload: sanitizeMetadata(input.payload),
    status: "queued",
    attempts: [],
    maxAttempts: input.maxAttempts ?? 3,
    scheduledAt: input.scheduledAt,
    createdAt: now,
    updatedAt: now,
    dedupeKey: input.dedupeKey,
  };
}

export function updateJobEnvelope(
  job: JobEnvelope,
  patch: Partial<Omit<JobEnvelope, "jobId" | "createdAt">>,
): JobEnvelope {
  return {
    ...job,
    ...patch,
    updatedAt: new Date(),
  };
}
