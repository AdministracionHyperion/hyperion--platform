import { sanitizeMetadata } from "../../../../packages/shared/src/core";
import type { RateLimitRule } from "./rate-limit-rule";

export function createRateLimitRule(input: {
  readonly ruleId: string;
  readonly scope: RateLimitRule["scope"];
  readonly limit: number;
  readonly windowMs: number;
  readonly burstLimit?: number;
  readonly enabled?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): RateLimitRule {
  return {
    ruleId: input.ruleId,
    scope: input.scope,
    limit: Math.max(1, input.limit),
    windowMs: Math.max(1, input.windowMs),
    ...(input.burstLimit === undefined ? {} : { burstLimit: Math.max(1, input.burstLimit) }),
    enabled: input.enabled ?? true,
    metadata: sanitizeMetadata(input.metadata),
  };
}

export function defaultApiRateLimitRule(input: {
  readonly method: string;
  readonly route: string;
}): RateLimitRule {
  if (input.route === "/health" || input.route === "/api/v1/version") {
    return createRateLimitRule({
      ruleId: "api-public-default",
      scope: "route",
      limit: 600,
      windowMs: 60_000,
    });
  }

  if (input.route.includes("/voice/calls") && input.method !== "GET") {
    return createRateLimitRule({
      ruleId: "api-voice-write-default",
      scope: "tenant_actor",
      limit: 30,
      windowMs: 60_000,
    });
  }

  if (input.route.includes("/products/cedco/d02")) {
    return createRateLimitRule({
      ruleId: "api-cedco-d02-default",
      scope: "tenant_actor",
      limit: 60,
      windowMs: 60_000,
    });
  }

  if (input.method === "GET") {
    return createRateLimitRule({
      ruleId: "api-read-default",
      scope: "tenant_actor",
      limit: 120,
      windowMs: 60_000,
    });
  }

  return createRateLimitRule({
    ruleId: "api-write-default",
    scope: "tenant_actor",
    limit: 60,
    windowMs: 60_000,
  });
}
