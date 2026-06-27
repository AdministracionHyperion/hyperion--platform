export interface RateLimitWindow {
  readonly count: number;
  readonly resetAt: Date;
}
