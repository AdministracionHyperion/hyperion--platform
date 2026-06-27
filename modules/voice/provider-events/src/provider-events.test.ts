import { describe, expect, it } from "vitest";
import { createOperationContext } from "../../../../packages/shared/src/core";
import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  metricNames,
} from "../../../../packages/observability/src";
import {
  ingestProviderEvent,
  InMemoryReplayProtectionStore,
  MockProviderEventNormalizer,
  MockProviderSignatureVerifier,
  sanitizeProviderEventPayload,
} from "./index";
import { createProviderEventId } from "./provider-event-id";

const context = createOperationContext({
  tenantId: "cedco-test",
  actorId: "actor-test",
  correlationId: "corr-provider-event-unit-001",
  source: "unit-test",
});

if (!context.ok) {
  throw new Error("invalid test operation context");
}

const baseInput = {
  context: context.value,
  source: "mock" as const,
  type: "provider.mock.call.completed" as const,
  eventId: "provider-event-001",
  providerCallRef: "mock_call_unit_001",
  occurredAt: new Date("2026-06-27T04:00:00.000Z"),
  headers: { "x-hyperion-mock-signature": "mock_valid_signature" },
  payload: {
    safeSummary: "Synthetic completed provider event.",
    safeIntent: "orientacion_general",
    disposition: "mock_completed",
  },
  normalizer: new MockProviderEventNormalizer(),
  signatureVerifier: new MockProviderSignatureVerifier(),
};

describe("provider event ingestion domain", () => {
  it("ProviderEventId rejects invalid values", () => {
    expect(createProviderEventId("Provider Event 1").ok).toBe(false);
  });

  it("MockProviderSignatureVerifier accepts mock_valid_signature", () => {
    const result = new MockProviderSignatureVerifier().verify({
      headers: { "x-hyperion-mock-signature": "mock_valid_signature" },
      eventId: "provider-event-001",
      payload: {},
    });
    expect(result.ok && result.value.verified).toBe(true);
  });

  it("MockProviderSignatureVerifier rejects missing signatures", () => {
    const result = new MockProviderSignatureVerifier().verify({
      headers: {},
      eventId: "provider-event-001",
      payload: {},
    });
    expect(result.ok).toBe(false);
  });

  it("MockProviderSignatureVerifier rejects invalid signatures", () => {
    const result = new MockProviderSignatureVerifier().verify({
      headers: { "x-hyperion-mock-signature": "invalid" },
      eventId: "provider-event-001",
      payload: {},
    });
    expect(result.ok).toBe(false);
  });

  it("InMemoryReplayProtectionStore detects replay", () => {
    const replay = new InMemoryReplayProtectionStore();
    replay.remember("mock:provider-event-001", 60_000);
    expect(replay.hasSeen("mock:provider-event-001")).toBe(true);
    expect(replay.hasSeen("mock:provider-event-002")).toBe(false);
  });

  it.each(["phoneNumber", "rawTranscript", "audioUrl", "token", "secret"] as const)(
    "sanitizer rejects %s",
    (field) => {
      expect(sanitizeProviderEventPayload({ [field]: "blocked" }).ok).toBe(false);
    },
  );

  it("sanitizer rejects huge payloads", () => {
    expect(sanitizeProviderEventPayload({ safeSummary: "x".repeat(20_000) }).ok).toBe(false);
  });

  it("normalizer converts provider.mock.call.completed without raw payload", async () => {
    const result = await ingestProviderEvent({
      ...baseInput,
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    expect(result.ok && result.value.event?.normalizedStatus).toBe("completed");
    expect(JSON.stringify(result)).not.toMatch(/rawPayload|rawTranscript|audioUrl/u);
  });

  it("source future_elevenlabs is blocked", async () => {
    const result = await ingestProviderEvent({
      ...baseInput,
      source: "future_elevenlabs",
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    expect(result.ok).toBe(false);
  });

  it("source future_sip is blocked", async () => {
    const result = await ingestProviderEvent({
      ...baseInput,
      source: "future_sip",
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    expect(result.ok).toBe(false);
  });

  it("providerCallRef without mock prefix is blocked", async () => {
    const result = await ingestProviderEvent({
      ...baseInput,
      providerCallRef: "provider-real-001",
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    expect(result.ok).toBe(false);
  });

  it("runtimeMode real is blocked", async () => {
    const result = await ingestProviderEvent({
      ...baseInput,
      payload: { runtimeMode: "real" },
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    expect(result.ok).toBe(false);
  });

  it("providerEgressEnabled and realCallsEnabled are blocked", async () => {
    const providerEgress = await ingestProviderEvent({
      ...baseInput,
      payload: { providerEgressEnabled: true },
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    const realCalls = await ingestProviderEvent({
      ...baseInput,
      eventId: "provider-event-002",
      payload: { realCallsEnabled: true },
      replayProtection: new InMemoryReplayProtectionStore(),
    });
    expect(providerEgress.ok).toBe(false);
    expect(realCalls.ok).toBe(false);
  });

  it("ingest registers metrics and audit without raw payload", async () => {
    const metrics = new InMemoryMetricsRegistry();
    const logger = new InMemoryLogger();
    const audits: unknown[] = [];
    const result = await ingestProviderEvent({
      ...baseInput,
      replayProtection: new InMemoryReplayProtectionStore(),
      metrics,
      logger,
      audit: {
        record: async (event) => {
          audits.push(event);
        },
      },
    });
    expect(result.ok).toBe(true);
    expect(
      metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.providerEventsProcessedTotal),
    ).toBe(true);
    expect(JSON.stringify(audits)).not.toMatch(/rawPayload|rawTranscript|audioUrl/u);
  });

  it("blocks replay events", async () => {
    const replayProtection = new InMemoryReplayProtectionStore();
    const first = await ingestProviderEvent({ ...baseInput, replayProtection });
    const second = await ingestProviderEvent({ ...baseInput, replayProtection });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });
});
