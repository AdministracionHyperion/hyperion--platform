export interface JobAttempt {
  readonly attemptNumber: number;
  readonly startedAt: Date;
  readonly finishedAt?: Date;
  readonly status: "running" | "succeeded" | "failed" | "blocked";
  readonly errorCode?: string;
}
