import type { DeadLetterEntry, DeadLetterQueuePort } from "./dead-letter-queue.port";
import type { JobEnvelope } from "./job-envelope";
import type { JobError } from "./job-error";

export class InMemoryDeadLetterQueue implements DeadLetterQueuePort {
  private readonly entries: DeadLetterEntry[] = [];

  async add(job: JobEnvelope, error: JobError): Promise<void> {
    this.entries.push({ job, error, deadLetteredAt: new Date() });
  }

  async list(): Promise<readonly DeadLetterEntry[]> {
    return [...this.entries];
  }

  async clear(): Promise<void> {
    this.entries.length = 0;
  }
}
