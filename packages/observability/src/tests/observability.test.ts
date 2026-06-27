import { describe, expect, it, vi } from "vitest";
import {
  ConsoleLogger,
  InMemoryLogger,
  InMemoryMetricsRegistry,
  redactedLogValue,
  sanitizeLogMetadata,
  startTimer,
  type ObservabilityContext,
} from "../index";

describe("observability package", () => {
  it("redacts sensitive metadata keys", () => {
    const metadata = sanitizeLogMetadata({
      phone: "blocked",
      email: "blocked@example.invalid",
      token: "blocked",
      rawTranscript: "blocked",
      audioUrl: "blocked",
      safe: "ok",
    });

    expect(metadata).toMatchObject({
      phone: redactedLogValue,
      email: redactedLogValue,
      token: redactedLogValue,
      rawTranscript: redactedLogValue,
      audioUrl: redactedLogValue,
      safe: "ok",
    });
  });

  it("redacts nested metadata", () => {
    const metadata = sanitizeLogMetadata({
      nested: {
        authorization: "blocked",
        safe: "ok",
      },
    });

    expect(metadata).toMatchObject({
      nested: {
        authorization: redactedLogValue,
        safe: "ok",
      },
    });
  });

  it("stores sanitized in-memory log entries", () => {
    const logger = new InMemoryLogger();
    logger.info({
      message: "test",
      correlationId: "corr-test",
      metadata: { phoneNumber: "blocked", safe: "ok" },
    });

    expect(logger.getEntries()).toHaveLength(1);
    expect(logger.getEntries()[0]?.metadata).toMatchObject({
      phoneNumber: redactedLogValue,
      safe: "ok",
    });
  });

  it("console logger writes sanitized JSON", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = new ConsoleLogger();

    logger.warn({
      message: "test",
      metadata: { cookie: "blocked" },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0]?.[0])).toContain(redactedLogValue);
    spy.mockRestore();
  });

  it("increments counters", () => {
    const metrics = new InMemoryMetricsRegistry();
    metrics.increment("test_counter", { route: "/test" });
    metrics.increment("test_counter", { route: "/test" }, 2);

    expect(metrics.snapshot().counters[0]).toMatchObject({ name: "test_counter", value: 3 });
  });

  it("observes durations", () => {
    const metrics = new InMemoryMetricsRegistry();
    metrics.observe("duration", 12, { route: "/test" });

    expect(metrics.snapshot().observations[0]).toMatchObject({
      name: "duration",
      count: 1,
      values: [12],
    });
  });

  it("measures non-negative duration", () => {
    let now = 10;
    const timer = startTimer(() => now);
    now = 7;

    expect(timer.elapsedMs()).toBe(0);
  });

  it("preserves observability context fields", () => {
    const context: ObservabilityContext = {
      tenantId: "cedco-test",
      actorId: "actor-test",
      correlationId: "corr-test",
    };

    expect(context).toMatchObject({
      tenantId: "cedco-test",
      actorId: "actor-test",
      correlationId: "corr-test",
    });
  });
});
