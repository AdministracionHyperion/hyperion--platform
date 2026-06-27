import type { JobError } from "./job-error";

export type RetryBackoff = "none" | "linear" | "exponential";

export interface RetryPolicyInput {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly backoff?: RetryBackoff;
}

export class RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoff: RetryBackoff;

  constructor(input: RetryPolicyInput = {}) {
    this.maxAttempts = input.maxAttempts ?? 3;
    this.baseDelayMs = input.baseDelayMs ?? 100;
    this.maxDelayMs = input.maxDelayMs ?? 2_000;
    this.backoff = input.backoff ?? "exponential";
  }

  shouldRetry(error: JobError, completedAttempts: number): boolean {
    return error.retryable && completedAttempts < this.maxAttempts;
  }

  nextDelayMs(completedAttempts: number): number {
    if (this.backoff === "none") {
      return 0;
    }

    const multiplier =
      this.backoff === "linear" ? completedAttempts : Math.max(1, 2 ** (completedAttempts - 1));
    return Math.min(this.baseDelayMs * multiplier, this.maxDelayMs);
  }
}
