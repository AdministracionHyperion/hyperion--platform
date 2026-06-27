import { describe, expect, it } from "vitest";
import type { SanitizedProviderEvent } from "../../../../../../voice/provider-events/src";
import {
  mapProviderEventToCedcoD02Outcome,
  processCedcoD02PostCallEvent,
  processCedcoD02ProviderEvent,
} from "./index";

const event: SanitizedProviderEvent = {
  eventId: "provider-event-cedco-001" as SanitizedProviderEvent["eventId"],
  source: "mock",
  type: "provider.mock.post_call.available",
  tenantId: "cedco-test",
  correlationId: "corr-provider-event-cedco-001",
  providerCallRef: "mock_call_cedco_001",
  safeCallSessionRef: "mock-session-provider-event-001",
  normalizedStatus: "post_call_available",
  safeOutcome: "mock_completed",
  safeSummary: "Synthetic CEDCO D02 post-call summary.",
  safeIntent: "orientacion_general",
  handoffRecommended: true,
  postCallAvailable: true,
  metadata: { channel: "mock" },
};

describe("CEDCO D02 provider event processing", () => {
  it("maps provider event completed to safe outcome", () => {
    expect(mapProviderEventToCedcoD02Outcome(event)).toMatchObject({
      outcome: "mock_completed",
      disposition: "mock_completed",
    });
  });

  it("post-call event produces safe summary", () => {
    const result = processCedcoD02PostCallEvent({ event });
    expect(result.ok && result.value.safeSummary).toContain("Synthetic");
  });

  it("post-call event does not produce diagnosis", () => {
    const result = processCedcoD02PostCallEvent({ event });
    expect(JSON.stringify(result)).not.toMatch(/diagn[oó]stico|triage cl[ií]nico/iu);
  });

  it("handoffRecommended remains operational", () => {
    const result = processCedcoD02ProviderEvent({ event });
    expect(result.ok && result.value.handoffRecommended).toBe(true);
  });

  it("post-call event rejects raw transcript", () => {
    const result = processCedcoD02PostCallEvent({
      event: { ...event, metadata: { rawTranscript: "blocked" } },
    });
    expect(result.ok).toBe(false);
  });

  it("post-call event rejects audio URL", () => {
    const result = processCedcoD02PostCallEvent({
      event: { ...event, metadata: { audioUrl: "https://example.invalid/audio.wav" } },
    });
    expect(result.ok).toBe(false);
  });

  it("metadata stays sanitized and compliance note has no PII", () => {
    const result = processCedcoD02ProviderEvent({ event });
    expect(JSON.stringify(result)).not.toMatch(/phoneNumber|rawTranscript|audioUrl/u);
  });
});
