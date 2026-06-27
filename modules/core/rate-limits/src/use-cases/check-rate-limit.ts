import {
  metricNames,
  sanitizeLogMetadata,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../../packages/observability/src";
import { createRateLimitKey } from "../rate-limit-key";
import type { RateLimitResult } from "../rate-limit-result";
import type { RateLimitRule } from "../rate-limit-rule";
import type { RateLimitStorePort } from "../rate-limit-store.port";

export interface CheckRateLimitInput {
  readonly store: RateLimitStorePort;
  readonly rule: RateLimitRule;
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly route: string;
  readonly method: string;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
}

export async function checkRateLimit(input: CheckRateLimitInput): Promise<RateLimitResult> {
  const key = createRateLimitKey(input);

  if (!input.rule.enabled) {
    return {
      allowed: true,
      remaining: input.rule.limit,
      resetAt: new Date(Date.now() + input.rule.windowMs),
      key,
      ruleId: input.rule.ruleId,
    };
  }

  const window = await input.store.increment(key, input.rule.windowMs);
  const allowed = window.count <= input.rule.limit;
  const remaining = Math.max(0, input.rule.limit - window.count);
  const retryAfterMs = Math.max(0, window.resetAt.getTime() - Date.now());

  input.metrics?.increment(metricNames.rateLimitChecksTotal, {
    ruleId: input.rule.ruleId,
    allowed: String(allowed),
  });

  if (!allowed) {
    input.metrics?.increment(metricNames.rateLimitDeniedTotal, { ruleId: input.rule.ruleId });
    input.logger?.warn({
      message: "rate_limit.denied",
      eventName: "rate_limit.denied",
      tenantId: input.tenantId,
      actorId: input.actorId,
      route: input.route,
      method: input.method,
      metadata: sanitizeLogMetadata({
        key,
        ruleId: input.rule.ruleId,
        retryAfterMs,
      }),
    });
  }

  return {
    allowed,
    remaining,
    resetAt: window.resetAt,
    ...(allowed ? {} : { retryAfterMs, reason: "rate_limit_exceeded" as const }),
    key,
    ruleId: input.rule.ruleId,
  };
}
