import { describe, expect, it } from "vitest";
import { MockCallRuntimeAdapter } from "./mock-call-runtime-adapter";
import { sanitizeCallRuntimePayload } from "./sanitize-call-runtime-payload";
import type { CallRuntimeCommand } from "./call-runtime-command";

describe("mock call runtime", () => {
  it("starts a mock session", async () => {
    const runtime = new MockCallRuntimeAdapter();
    const result = await runtime.startSession(commandFixture());
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.session.status).toBe("running");
  });

  it("creates providerCallRef with mock prefix", async () => {
    const result = await new MockCallRuntimeAdapter().startSession(commandFixture());
    expect(result.ok && result.value.session.providerCallRef.startsWith("mock_call_")).toBe(true);
  });

  it("does not store real phone-like fields", async () => {
    const result = await new MockCallRuntimeAdapter().startSession(commandFixture());
    expect(JSON.stringify(result)).not.toMatch(/phoneNumber|to_number|\+57/u);
  });

  it("generates synthetic events", async () => {
    const result = await new MockCallRuntimeAdapter().startSession(commandFixture());
    expect(result.ok && result.value.events.map((event) => event.type)).toEqual([
      "call.mock.started",
      "call.mock.agent_prompted",
      "call.mock.user_intent_detected",
      "call.mock.completed",
    ]);
  });

  it("processEvent updates session state", async () => {
    const runtime = new MockCallRuntimeAdapter();
    const started = await runtime.startSession(commandFixture());
    if (!started.ok) throw new Error("expected start");
    const processed = await runtime.processEvent(started.value.events.at(-1)!);
    expect(processed.ok && processed.value.status).toBe("completed");
  });

  it("finalizeSession produces completed session", async () => {
    const runtime = new MockCallRuntimeAdapter();
    const started = await runtime.startSession(commandFixture());
    if (!started.ok) throw new Error("expected start");
    const finalized = await runtime.finalizeSession(started.value.session.sessionId);
    expect(finalized.ok && finalized.value.session.status).toBe("completed");
  });

  it("post-call result does not contain rawTranscript", async () => {
    const finalized = await finalizedFixture();
    expect(JSON.stringify(finalized)).not.toContain("rawTranscript");
  });

  it("post-call result does not contain audioUrl", async () => {
    const finalized = await finalizedFixture();
    expect(JSON.stringify(finalized)).not.toContain("audioUrl");
  });

  it("sanitizer rejects phoneNumber", () => {
    expect(sanitizeCallRuntimePayload({ phoneNumber: "blocked" }).ok).toBe(false);
  });

  it("sanitizer rejects token and secret", () => {
    expect(sanitizeCallRuntimePayload({ token: "blocked" }).ok).toBe(false);
    expect(sanitizeCallRuntimePayload({ nested: { secret: "blocked" } }).ok).toBe(false);
  });

  it("blocks runtimeMode real", async () => {
    const runtime = new MockCallRuntimeAdapter();
    const result = await runtime.startSession({
      ...commandFixture(),
      runtimeMode: "real" as "mock",
    });
    expect(result.ok).toBe(false);
  });

  it("blocks providerEgressEnabled payloads", async () => {
    const runtime = new MockCallRuntimeAdapter();
    const result = await runtime.startSession({
      ...commandFixture(),
      metadata: { providerEgressEnabled: true },
    });
    expect(result.ok).toBe(false);
  });
});

function commandFixture(): CallRuntimeCommand {
  return {
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-runtime-test-001",
    callIntentId: "cedco-d02-intent-test",
    productCode: "cedco-d02",
    runtimeMode: "mock",
    scriptId: "cedco-d02-default-mock",
    safeContactRef: "safe-contact-ref-001",
    patientContextRef: "cedco-context-ref-001",
    consentRef: "cedco-consent-ref-001",
    metadata: {},
  };
}

async function finalizedFixture() {
  const runtime = new MockCallRuntimeAdapter();
  const started = await runtime.startSession(commandFixture());
  if (!started.ok) throw new Error("expected start");
  const finalized = await runtime.finalizeSession(started.value.session.sessionId);
  if (!finalized.ok) throw new Error("expected finalized");
  return finalized.value;
}
