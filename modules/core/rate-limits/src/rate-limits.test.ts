import { describe, expect, it } from "vitest";
import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  metricNames,
} from "../../../../packages/observability/src";
import { InMemoryRateLimitStore } from "./in-memory-rate-limit-store";
import { createRateLimitKey } from "./rate-limit-key";
import { createRateLimitRule } from "./rate-limit-policy";
import { checkRateLimit } from "./use-cases/check-rate-limit";

describe("rate limits", () => {
  it("allows requests inside the limit and decrements remaining", async () => {
    const store = new InMemoryRateLimitStore();
    const rule = createRateLimitRule({
      ruleId: "test-rule",
      scope: "tenant_actor",
      limit: 2,
      windowMs: 60_000,
    });

    const first = await checkRateLimit(baseInput(store, rule));
    const second = await checkRateLimit(baseInput(store, rule));

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("denies when the limit is exceeded and returns retryAfterMs", async () => {
    const store = new InMemoryRateLimitStore();
    const rule = createRateLimitRule({
      ruleId: "test-rule",
      scope: "tenant_actor",
      limit: 1,
      windowMs: 60_000,
    });

    await checkRateLimit(baseInput(store, rule));
    const denied = await checkRateLimit(baseInput(store, rule));

    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("rate_limit_exceeded");
    expect(denied.retryAfterMs).toBeGreaterThan(0);
  });

  it("reset clears the active window", async () => {
    const store = new InMemoryRateLimitStore();
    const rule = createRateLimitRule({
      ruleId: "test-rule",
      scope: "tenant_actor",
      limit: 1,
      windowMs: 60_000,
    });

    const first = await checkRateLimit(baseInput(store, rule));
    await store.reset(first.key);
    const second = await checkRateLimit(baseInput(store, rule));

    expect(second.allowed).toBe(true);
  });

  it("creates safe keys and distinct scopes", () => {
    const tenantActorRule = createRateLimitRule({
      ruleId: "tenant-actor",
      scope: "tenant_actor",
      limit: 1,
      windowMs: 60_000,
    });
    const tenantRouteRule = createRateLimitRule({
      ruleId: "tenant-route",
      scope: "tenant_route",
      limit: 1,
      windowMs: 60_000,
    });

    const tenantActorKey = createRateLimitKey({
      rule: tenantActorRule,
      tenantId: "cedco-test",
      actorId: "actor-test",
      route: "/api/v1/tenants/cedco-test/context",
      method: "GET",
    });
    const tenantRouteKey = createRateLimitKey({
      rule: tenantRouteRule,
      tenantId: "cedco-test",
      actorId: "actor-test",
      route: "/api/v1/tenants/cedco-test/context",
      method: "GET",
    });

    expect(tenantActorKey).not.toBe(tenantRouteKey);
    expect(tenantActorKey).not.toContain("@");
  });

  it("records metrics and sanitized logs for denied requests", async () => {
    const store = new InMemoryRateLimitStore();
    const metrics = new InMemoryMetricsRegistry();
    const logger = new InMemoryLogger();
    const rule = createRateLimitRule({
      ruleId: "test-rule",
      scope: "tenant_actor",
      limit: 1,
      windowMs: 60_000,
    });

    await checkRateLimit(baseInput(store, rule, metrics, logger));
    await checkRateLimit(baseInput(store, rule, metrics, logger));

    expect(
      metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.rateLimitChecksTotal),
    ).toBe(true);
    expect(
      metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.rateLimitDeniedTotal),
    ).toBe(true);
    expect(JSON.stringify(logger.getEntries())).not.toContain("token");
  });
});

function baseInput(
  store: InMemoryRateLimitStore,
  rule: ReturnType<typeof createRateLimitRule>,
  metrics?: InMemoryMetricsRegistry,
  logger?: InMemoryLogger,
) {
  return {
    store,
    rule,
    tenantId: "cedco-test",
    actorId: "actor-test",
    route: "/api/v1/tenants/cedco-test/context",
    method: "GET",
    metrics,
    logger,
  };
}
