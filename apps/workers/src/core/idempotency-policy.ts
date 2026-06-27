import type { JobEnvelope } from "./job-envelope";

export class IdempotencyPolicy {
  private readonly succeededKeys = new Set<string>();
  private readonly runningLocks = new Set<string>();

  keyFor(job: JobEnvelope): string {
    return job.dedupeKey ?? job.jobId;
  }

  hasSucceeded(job: JobEnvelope): boolean {
    return this.succeededKeys.has(this.keyFor(job));
  }

  tryStart(job: JobEnvelope): boolean {
    const key = this.keyFor(job);
    if (this.succeededKeys.has(key) || this.runningLocks.has(key)) {
      return false;
    }
    this.runningLocks.add(key);
    return true;
  }

  markSucceeded(job: JobEnvelope): void {
    const key = this.keyFor(job);
    this.runningLocks.delete(key);
    this.succeededKeys.add(key);
  }

  markFinished(job: JobEnvelope): void {
    this.runningLocks.delete(this.keyFor(job));
  }

  clear(): void {
    this.succeededKeys.clear();
    this.runningLocks.clear();
  }
}
