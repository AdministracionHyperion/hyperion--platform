import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { RateLimitScope } from "./rate-limit-scope";

export interface RateLimitRule {
  readonly ruleId: string;
  readonly scope: RateLimitScope;
  readonly limit: number;
  readonly windowMs: number;
  readonly burstLimit?: number;
  readonly enabled: boolean;
  readonly metadata: SafeMetadata;
}
