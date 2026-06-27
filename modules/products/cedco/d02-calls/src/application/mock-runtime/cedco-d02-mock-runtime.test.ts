import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  metricNames,
} from "../../../../../../../packages/observability/src";
import { MockCallRuntimeAdapter } from "../../../../../../voice/call-runtime/src";
import { describe, expect, it } from "vitest";
import { buildCedcoD02MockCallIntent } from "./build-cedco-d02-mock-call-intent";
import { evaluateCedcoD02MockReadiness } from "./evaluate-cedco-d02-mock-readiness";
import { processCedcoD02MockPostCall } from "./process-cedco-d02-mock-post-call";
import { runCedcoD02MockCallFlow } from "./run-cedco-d02-mock-call-flow";

describe("CEDCO D02 mock runtime flow", () => {
  it("builds a safe intent", () => {
    const intent = buildCedcoD02MockCallIntent(intentFixture());
    expect(intent.ok).toBe(true);
    expect(intent.ok && intent.value.runtimeMode).toBe("mock");
  });

  it("readiness passes with consentRef and safeContactRef", () => {
    const intent = mustIntent(intentFixture());
    const readiness = evaluateCedcoD02MockReadiness(intent);
    expect(readiness.ok && readiness.value.ready).toBe(true);
  });

  it("readiness fails without consentRef", () => {
    const intent = mustIntent({ ...intentFixture(), consentRef: "" });
    const readiness = evaluateCedcoD02MockReadiness(intent);
    expect(readiness.ok && readiness.value.blockingReasons).toContain("missing_consent_ref");
  });

  it("readiness fails with phone-like contact", () => {
    const intent = mustIntent({ ...intentFixture(), safeContactRef: "+570000000000" });
    const readiness = evaluateCedcoD02MockReadiness(intent);
    expect(readiness.ok && readiness.value.blockingReasons).toContain("phone_real_blocked");
  });

  it("readiness fails with diagnostic intent", () => {
    const intent = mustIntent({
      ...intentFixture(),
      metadata: { intent: "diagnostico" },
    });
    const readiness = evaluateCedcoD02MockReadiness(intent);
    expect(readiness.ok && readiness.value.blockingReasons).toContain("diagnostic_intent_blocked");
  });

  it("runs the full mock flow to completed", async () => {
    const result = await runCedcoD02MockCallFlow({
      intent: intentFixture(),
      runtime: new MockCallRuntimeAdapter(),
    });
    expect(result.ok && result.value.status).toBe("completed");
  });

  it("records metrics", async () => {
    const metrics = new InMemoryMetricsRegistry();
    await runCedcoD02MockCallFlow({ intent: intentFixture(), metrics });
    expect(
      metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.mockCallFlowsCompletedTotal),
    ).toBe(true);
  });

  it("records audit events", async () => {
    const auditEvents: unknown[] = [];
    await runCedcoD02MockCallFlow({
      intent: intentFixture(),
      audit: {
        record: async (event) => {
          auditEvents.push(event);
        },
      },
    });
    expect(auditEvents).toHaveLength(2);
  });

  it("post-call produces safeSummary", async () => {
    const result = await runCedcoD02MockCallFlow({ intent: intentFixture() });
    expect(result.ok && result.value.safeSummary).toContain("mock");
  });

  it("post-call does not produce diagnosis", async () => {
    const result = await runCedcoD02MockCallFlow({ intent: intentFixture() });
    expect(JSON.stringify(result)).not.toMatch(/diagnostico|diagnosis/iu);
  });

  it("handoff is only a non-clinical recommendation", () => {
    const processed = processCedcoD02MockPostCall({
      outcome: "handoff_recommended",
      detectedIntent: "solicitar_humano",
      disposition: "needs_handoff_mock",
      safeSummary: "Resumen seguro mock.",
      nextRecommendedAction: "human_review",
      handoffRecommended: true,
      auditNotes: ["mock_only"],
      metrics: {},
    });
    expect(processed.ok && processed.value.handoffRecommended).toBe(true);
  });

  it("sanitizes metadata", () => {
    const intent = buildCedcoD02MockCallIntent({
      ...intentFixture(),
      metadata: { email: "synthetic@example.invalid" },
    });
    expect(JSON.stringify(intent)).not.toContain("synthetic@example.invalid");
  });

  it("logs without PII", async () => {
    const logger = new InMemoryLogger();
    await runCedcoD02MockCallFlow({ intent: intentFixture(), logger });
    expect(JSON.stringify(logger.getEntries())).not.toMatch(/phone|rawTranscript|audioUrl/u);
  });
});

function intentFixture() {
  return {
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-cedco-mock-001",
    cedcoSiteId: "bucaramanga",
    serviceId: "odontologia-general-test",
    agreementId: "convenio-test",
    safeContactRef: "safe-contact-ref-001",
    patientContextRef: "cedco-context-ref-001",
    consentRef: "cedco-consent-ref-001",
    callPurpose: "orientation" as const,
    objective: "orientation" as const,
    metadata: {},
  };
}

function mustIntent(input: ReturnType<typeof intentFixture>) {
  const intent = buildCedcoD02MockCallIntent(input);
  if (!intent.ok) throw new Error("expected intent");
  return intent.value;
}
