import type { JobEnvelope } from "./job-envelope";
import type { JobError } from "./job-error";

export interface DeadLetterEntry {
  readonly job: JobEnvelope;
  readonly error: JobError;
  readonly deadLetteredAt: Date;
}

export interface DeadLetterQueuePort {
  add(job: JobEnvelope, error: JobError): Promise<void>;
  list(): Promise<readonly DeadLetterEntry[]>;
  clear(): Promise<void>;
}
