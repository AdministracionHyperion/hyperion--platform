export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: Date;
  readonly retryAfterMs?: number;
  readonly key: string;
  readonly ruleId: string;
  readonly reason?: "rate_limit_exceeded";
}
