import { describe, expect, it } from "vitest";

import {
  classifyCedcoCallIntent,
  createCedcoD02Configuration,
  createCedcoD02EvalScenario,
  createCedcoEligibilityCheck,
  createCedcoSchedulingRequest,
  createCedcoServiceId,
  createCedcoSiteId,
  evaluateCedcoCallReadiness,
  evaluateCedcoCompliance,
  evaluateCedcoHandoff,
  recordCedcoD02Metric,
  registerCedcoAgreement,
  registerCedcoService,
  registerCedcoSite,
  summarizeCedcoD02Readiness,
  type CedcoServiceId,
  type CedcoSiteId,
} from "./src";
import { createCallId } from "../../../voice/voice-core/src";
import { redactedMetadataValue } from "../../../../packages/shared/src/core";
import { InMemoryFeedbackRepository } from "../../../../packages/testing/src/core";
import {
  FakeCedcoD02Metrics,
  InMemoryCedcoAgreementRepository,
  InMemoryCedcoD02ConfigurationRepository,
  InMemoryCedcoServiceRepository,
  InMemoryCedcoSiteRepository,
  createCedcoD02TestConfiguration,
  createCedcoD02TestContext,
} from "../../../../packages/testing/src/products/cedco/d02-calls";

describe("CEDCO D02 domain", () => {
  it("allows initial CEDCO site IDs", () => {
    expect(createCedcoSiteId("bucaramanga").ok).toBe(true);
    expect(createCedcoSiteId("piedecuesta").ok).toBe(true);
    expect(createCedcoSiteId("barrancabermeja").ok).toBe(true);
  });

  it("rejects unsafe CEDCO site IDs", () => {
    expect(createCedcoSiteId("Bucaramanga").ok).toBe(false);
    expect(createCedcoSiteId("bucaramanga principal").ok).toBe(false);
    expect(createCedcoSiteId("sede_desconocida").ok).toBe(false);
    expect(createCedcoSiteId("").ok).toBe(false);
  });

  it("registers CEDCO sites with tenantId", async () => {
    const { context, admin } = createCedcoD02TestContext();
    const result = await registerCedcoSite({
      context,
      actor: admin,
      repository: new InMemoryCedcoSiteRepository(),
      siteId: "bucaramanga",
      name: "Bucaramanga",
      city: "Bucaramanga",
    });

    expect(result.ok && result.value.tenantId).toBe("tenant-alpha");
    expect(result.ok && result.value.siteId).toBe("bucaramanga");
  });

  it("rejects services with sites outside the allowlist", async () => {
    const { context, admin } = createCedcoD02TestContext();

    const result = await registerCedcoService({
      context,
      actor: admin,
      repository: new InMemoryCedcoServiceRepository(),
      serviceId: "general-orientation",
      name: "General orientation",
      category: "general",
      availableSiteIds: ["piedecuesta"],
      allowedSiteIds: [requiredSiteId("bucaramanga")],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects agreements with services outside the allowlist", async () => {
    const { context, admin } = createCedcoD02TestContext();

    const result = await registerCedcoAgreement({
      context,
      actor: admin,
      repository: new InMemoryCedcoAgreementRepository(),
      agreementId: "eps-demo",
      name: "EPS demo",
      applicableServiceIds: ["unknown-service"],
      allowedServiceIds: [requiredServiceId("general-orientation")],
    });

    expect(result.ok).toBe(false);
  });

  it("sanitizes site, service, and agreement metadata", async () => {
    const { context, admin } = createCedcoD02TestContext();
    const site = await registerCedcoSite({
      context,
      actor: admin,
      repository: new InMemoryCedcoSiteRepository(),
      siteId: "bucaramanga",
      name: "Bucaramanga",
      city: "Bucaramanga",
      metadata: { phone: "redacted", safe: "kept" },
    });
    const service = await registerCedcoService({
      context,
      actor: admin,
      repository: new InMemoryCedcoServiceRepository(),
      serviceId: "general-orientation",
      name: "General orientation",
      category: "general",
      availableSiteIds: ["bucaramanga"],
      allowedSiteIds: [requiredSiteId("bucaramanga")],
      metadata: { email: "person@example.invalid", safe: "kept" },
    });
    const agreement = await registerCedcoAgreement({
      context,
      actor: admin,
      repository: new InMemoryCedcoAgreementRepository(),
      agreementId: "eps-demo",
      name: "EPS demo",
      applicableServiceIds: ["general-orientation"],
      allowedServiceIds: [requiredServiceId("general-orientation")],
      metadata: { token: "value", safe: "kept" },
    });

    expect(site.ok && site.value.metadata.phone).toBe(redactedMetadataValue);
    expect(service.ok && service.value.metadata.email).toBe(redactedMetadataValue);
    expect(agreement.ok && agreement.value.metadata.token).toBe(redactedMetadataValue);
  });

  it("creates es-CO CEDCO D02 configuration", async () => {
    const { context, admin } = createCedcoD02TestContext();
    const result = await createCedcoD02Configuration({
      context,
      actor: admin,
      repository: new InMemoryCedcoD02ConfigurationRepository(),
    });

    expect(result.ok && result.value.defaultLocale).toBe("es-CO");
  });

  it("keeps realCallsEnabled false by default", async () => {
    const { context, admin } = createCedcoD02TestContext();
    const result = await createCedcoD02Configuration({
      context,
      actor: admin,
      repository: new InMemoryCedcoD02ConfigurationRepository(),
    });

    expect(result.ok && result.value.realCallsEnabled).toBe(false);
  });

  it("does not create real scheduling or eligibility integrations by default", async () => {
    const { context, admin } = createCedcoD02TestContext();
    const result = await createCedcoD02Configuration({
      context,
      actor: admin,
      repository: new InMemoryCedcoD02ConfigurationRepository(),
    });

    expect(result.ok && result.value.schedulingMode).toBe("disabled");
    expect(result.ok && result.value.eligibilityMode).toBe("disabled");
  });

  it("requires activeAgentVersionId for operational readiness", async () => {
    const { context } = createCedcoD02TestContext();
    const readiness = await evaluateCedcoCallReadiness({
      context,
      configuration: createCedcoD02TestConfiguration({ activeAgentVersionId: undefined }),
      objective: "orientation",
    });

    expect(readiness.ok && readiness.value.blockingReasons).toContain("missing_agent_version");
  });

  it("requires activeKnowledgeBaseVersionId for FAQ, agreements, and services", async () => {
    const { context } = createCedcoD02TestContext();
    const readiness = await evaluateCedcoCallReadiness({
      context,
      configuration: createCedcoD02TestConfiguration({ activeKnowledgeBaseVersionId: undefined }),
      objective: "faq",
      intent: "consultar_convenio",
    });

    expect(readiness.ok && readiness.value.blockingReasons).toContain(
      "missing_knowledge_base_version",
    );
  });

  it("classifies site inquiries", () => {
    expect(classifyCedcoCallIntent({ textRedacted: "Donde queda la sede de Bucaramanga" })).toBe(
      "consultar_sede",
    );
  });

  it("classifies scheduling requests", () => {
    expect(classifyCedcoCallIntent({ textRedacted: "Quiero agendar una cita" })).toBe("agendar");
  });

  it("classifies human requests", () => {
    expect(classifyCedcoCallIntent({ textRedacted: "Necesito hablar con un asesor humano" })).toBe(
      "solicitar_humano",
    );
  });

  it("classifies opt-out requests", () => {
    expect(classifyCedcoCallIntent({ textRedacted: "No llamar de nuevo, retirar contacto" })).toBe(
      "opt_out",
    );
  });

  it("falls back to unknown intent", () => {
    expect(classifyCedcoCallIntent({ textRedacted: "texto sin clasificacion" })).toBe(
      "desconocida",
    );
  });

  it("blocks medical diagnosis", () => {
    const result = evaluateCedcoCompliance({
      textRedacted: "Necesito un diagnostico medico",
    });

    expect(result.ok && result.value.blocked).toBe(true);
    expect(result.ok && result.value.reasons).toContain("no_diagnosis");
  });

  it("blocks clinical triage", () => {
    const result = evaluateCedcoCompliance({
      textRedacted: "Hagame triage clinico por telefono",
    });

    expect(result.ok && result.value.blocked).toBe(true);
    expect(result.ok && result.value.reasons).toContain("no_clinical_triage");
  });

  it("blocks raw transcript, audio URL, and phone metadata", () => {
    const result = evaluateCedcoCompliance({
      metadata: { rawTranscript: "raw", audioUrl: "https://example.invalid/a.wav", phone: "x" },
    });

    expect(result.ok && result.value.blocked).toBe(true);
    expect(result.ok && result.value.reasons.join("|")).toContain("sensitive_metadata");
  });

  it("routes medical urgency to handoff without diagnosis", () => {
    const result = evaluateCedcoCompliance({ intent: "urgencia" });

    expect(result.ok && result.value.blocked).toBe(false);
    expect(result.ok && result.value.handoffRequired).toBe(true);
    expect(result.ok && result.value.reasons).toContain("urgent_case_handoff_without_diagnosis");
  });

  it("marks opt-out for closure and handoff", () => {
    const result = evaluateCedcoCompliance({ intent: "opt_out" });

    expect(result.ok && result.value.closureRequired).toBe(true);
    expect(result.ok && result.value.handoffRequired).toBe(true);
  });

  it("creates scheduling requests without real appointments", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoSchedulingRequest({
      context,
      configuration: createCedcoD02TestConfiguration(),
      patientContextRef: "cedco-context-ref-001",
      serviceId: "general-orientation",
      callId: requiredCallId("call-scheduling-001"),
    });

    expect(result.ok && result.value.status).toBe("mock_confirmed");
    expect(JSON.stringify(result.ok && result.value)).not.toContain("appointment");
  });

  it("orients when scheduling mode is disabled", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoSchedulingRequest({
      context,
      configuration: createCedcoD02TestConfiguration({ schedulingMode: "disabled" }),
      patientContextRef: "cedco-context-ref-001",
      serviceId: "general-orientation",
    });

    expect(result.ok && result.value.status).toBe("oriented");
  });

  it("produces synthetic scheduling in mock mode", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoSchedulingRequest({
      context,
      configuration: createCedcoD02TestConfiguration({ schedulingMode: "mock" }),
      patientContextRef: "cedco-context-ref-001",
      serviceId: "general-orientation",
    });

    expect(result.ok && result.value.status).toBe("mock_confirmed");
  });

  it("marks scheduling integration as required in this loop", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoSchedulingRequest({
      context,
      configuration: createCedcoD02TestConfiguration({ schedulingMode: "integration" }),
      patientContextRef: "cedco-context-ref-001",
      serviceId: "general-orientation",
    });

    expect(result.ok && result.value.status).toBe("integration_required");
  });

  it("does not validate real eligibility when disabled", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoEligibilityCheck({
      context,
      configuration: createCedcoD02TestConfiguration({ eligibilityMode: "disabled" }),
      patientContextRef: "cedco-context-ref-001",
    });

    expect(result.ok && result.value.status).toBe("unknown");
  });

  it("produces synthetic eligibility in mock mode", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoEligibilityCheck({
      context,
      configuration: createCedcoD02TestConfiguration({ eligibilityMode: "mock" }),
      patientContextRef: "cedco-context-ref-001",
      agreementId: "eps-demo",
    });

    expect(result.ok && result.value.status).toBe("eligible");
  });

  it("marks eligibility integration as required in this loop", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoEligibilityCheck({
      context,
      configuration: createCedcoD02TestConfiguration({ eligibilityMode: "integration" }),
      patientContextRef: "cedco-context-ref-001",
      agreementId: "eps-demo",
    });

    expect(result.ok && result.value.status).toBe("integration_required");
  });

  it("does not affirm real agreement coverage when agreement is unknown", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await createCedcoEligibilityCheck({
      context,
      configuration: createCedcoD02TestConfiguration({ eligibilityMode: "mock" }),
      patientContextRef: "cedco-context-ref-001",
      agreementId: "eps-demo",
      agreementKnown: false,
    });

    expect(result.ok && result.value.status).toBe("unknown");
  });

  it("recommends handoff when the user asks for a human", () => {
    const result = evaluateCedcoHandoff({ intent: "solicitar_humano" });

    expect(result.ok && result.value.shouldHandoff).toBe(true);
    expect(result.ok && result.value.reason).toBe("user_requested_human");
  });

  it("recommends handoff for urgency", () => {
    const result = evaluateCedcoHandoff({ intent: "urgencia" });

    expect(result.ok && result.value.shouldHandoff).toBe(true);
    expect(result.ok && result.value.priority).toBe("urgent");
  });

  it("recommends handoff for low confidence", () => {
    const result = evaluateCedcoHandoff({ intent: "desconocida", confidence: 0.2 });

    expect(result.ok && result.value.shouldHandoff).toBe(true);
    expect(result.ok && result.value.reason).toBe("low_confidence");
  });

  it("recommends handoff for unknown service or agreement when the user insists", () => {
    const result = evaluateCedcoHandoff({
      intent: "consultar_convenio",
      unknownKnowledgeAndUserInsists: true,
    });

    expect(result.ok && result.value.shouldHandoff).toBe(true);
    expect(result.ok && result.value.reason).toBe("unknown_knowledge");
  });

  it("blocks readiness when agent version is missing", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await evaluateCedcoCallReadiness({
      context,
      configuration: createCedcoD02TestConfiguration({ activeAgentVersionId: undefined }),
      objective: "scheduling",
    });

    expect(result.ok && result.value.blockingReasons).toContain("missing_agent_version");
  });

  it("blocks readiness when KB is missing for FAQ", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await evaluateCedcoCallReadiness({
      context,
      configuration: createCedcoD02TestConfiguration({ activeKnowledgeBaseVersionId: undefined }),
      objective: "faq",
    });

    expect(result.ok && result.value.blockingReasons).toContain("missing_knowledge_base_version");
  });

  it("blocks readiness when metadata contains a real phone key", async () => {
    const { context } = createCedcoD02TestContext();
    const result = await evaluateCedcoCallReadiness({
      context,
      configuration: createCedcoD02TestConfiguration(),
      objective: "orientation",
      metadata: { phone: "redacted" },
    });

    expect(result.ok && result.value.blockingReasons).toContain("pii_policy_violation");
  });

  it("does not declare production readiness prematurely", async () => {
    const { context } = createCedcoD02TestContext();
    const readiness = await evaluateCedcoCallReadiness({
      context,
      configuration: createCedcoD02TestConfiguration(),
      objective: "orientation",
    });
    if (!readiness.ok) {
      throw new Error("readiness should be computed");
    }

    const summary = summarizeCedcoD02Readiness({ readiness: readiness.value });

    expect(summary.productionReady).toBe(false);
    expect(summary.gaps).toContain("provider_not_configured");
  });

  it("requires forbidden behavior in eval scenarios", () => {
    const { context } = createCedcoD02TestContext();
    const result = createCedcoD02EvalScenario({
      context,
      evalScenarioId: "missing-forbidden",
      intent: "consultar_sede",
      objective: "faq",
      input: "Synthetic",
      expectedBehavior: "Answer safely",
      forbiddenBehavior: "",
      severity: "high",
    });

    expect(result.ok).toBe(false);
  });

  it("records metrics with sanitized dimensions", async () => {
    const { context } = createCedcoD02TestContext();
    const metrics = new FakeCedcoD02Metrics();

    const result = await recordCedcoD02Metric({
      context,
      metricsPort: metrics,
      key: "cedco.d02.intent.count",
      value: 1,
      dimensions: { phone: "redacted", intent: "consultar_sede" },
    });
    const stored = await metrics.summarizeByTenant(context.tenantId);

    expect(result.ok && result.value.dimensions.phone).toBe(redactedMetadataValue);
    expect(stored).toHaveLength(1);
  });

  it("feeds feedback when policy violation metrics are recorded", async () => {
    const { context } = createCedcoD02TestContext();
    const feedbackRepository = new InMemoryFeedbackRepository();

    await recordCedcoD02Metric({
      context,
      metricsPort: new FakeCedcoD02Metrics(),
      key: "cedco.d02.policy.violation",
      value: 1,
      dimensions: { reason: "no_diagnosis" },
      feedbackRepository,
      policyViolation: true,
    });
    const feedback = await feedbackRepository.findByTenant(context.tenantId);

    expect(feedback).toHaveLength(1);
    expect(feedback[0]?.outcome).toBe("policy_violation");
  });
});

function requiredSiteId(value: string): CedcoSiteId {
  const siteId = createCedcoSiteId(value);
  if (!siteId.ok) {
    throw new Error(`invalid test site id ${value}`);
  }
  return siteId.value;
}

function requiredServiceId(value: string): CedcoServiceId {
  const serviceId = createCedcoServiceId(value);
  if (!serviceId.ok) {
    throw new Error(`invalid test service id ${value}`);
  }
  return serviceId.value;
}

function requiredCallId(value: string) {
  const callId = createCallId(value);
  if (!callId.ok) {
    throw new Error(`invalid test call id ${value}`);
  }
  return callId.value;
}
