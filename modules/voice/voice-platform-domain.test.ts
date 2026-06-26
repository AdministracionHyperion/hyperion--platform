import { describe, expect, it } from "vitest";

import {
  closeCallSession,
  createCallId,
  createCallSession,
  recordConversationTurn,
  registerCallEvent,
  transitionCallStatus,
} from "./voice-core/src";
import {
  applyTurnDecision,
  decideNextTurn,
  prepareCallOrchestration,
  type CallContext,
} from "./call-orchestration/src";
import {
  dispatchOutboundCall,
  ingestPostCallResult,
  ingestProviderCallEvent,
  prepareOutboundCallLaunch,
  validateCallDispatchPolicy,
  createCalleeAlias,
  createCallerAlias,
  createProviderCallReference,
  type CallProviderConfig,
  type CallProviderPort,
  type OutboundCallLaunchRequest,
  type OutboundCallLaunchResult,
  type RuntimeContactTarget,
  type SipTrunkReadiness,
} from "./telephony/src";
import {
  validateTurnTakingPolicy,
  validateVoiceProfile,
  type VoiceProfile,
  type TurnTakingPolicy,
} from "./speech/src";
import { assignHandoff, createHandoffRequest, resolveHandoff } from "./handoff/src";
import { redactedMetadataValue } from "../../packages/shared/src/core";
import { InMemoryFeedbackRepository } from "../../packages/testing/src/core";
import {
  FakeCallContextLoader,
  FakeCallProvider,
  FakeContactResolver,
  FakeIntentEngine,
  FakeResponseGenerator,
  FakeSpeechToText,
  FakeTextToSpeech,
  InMemoryCallEventRepository,
  InMemoryCallSessionRepository,
  InMemoryHandoffRepository,
  createVoiceParticipants,
  createVoiceTestContext,
} from "../../packages/testing/src/voice";

describe("voice platform domain", () => {
  it("rejects invalid CallId values", () => {
    expect(createCallId("call-cedco-001").ok).toBe(true);
    expect(createCallId("Call Cedco").ok).toBe(false);
    expect(createCallId("call_cedco").ok).toBe(false);
    expect(createCallId("").ok).toBe(false);
  });

  it("rejects real phone numbers as CalleeAlias", () => {
    expect(createCalleeAlias("cedco-user-001").ok).toBe(true);
    expect(createCalleeAlias("+573001112233").ok).toBe(false);
    expect(createCalleeAlias("phone-user-001").ok).toBe(false);
    expect(createCalleeAlias("3001112233").ok).toBe(false);
  });

  it("rejects real phone numbers as CallerAlias", () => {
    expect(createCallerAlias("cedco-did-main").ok).toBe(true);
    expect(createCallerAlias("+573001112233").ok).toBe(false);
    expect(createCallerAlias("tel-main").ok).toBe(false);
    expect(createCallerAlias("3001112233").ok).toBe(false);
  });

  it("creates call sessions with tenantId, callId, and correlationId", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallSessionRepository();

    const session = await createCallSession({
      context,
      repository,
      callId: "call-session-001",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });

    expect(session.ok && session.value.tenantId).toBe("tenant-alpha");
    expect(session.ok && session.value.callId).toBe("call-session-001");
    expect(session.ok && session.value.correlationId).toBe("corr-voice-001");
  });

  it("sanitizes call session metadata", async () => {
    const { context } = createVoiceTestContext();
    const result = await createCallSession({
      context,
      repository: new InMemoryCallSessionRepository(),
      callId: "call-session-metadata",
      direction: "outbound",
      participants: createVoiceParticipants(),
      metadata: {
        phone: "+570000000000",
        audioUrl: "https://example.invalid/audio.wav",
        safe: "ok",
      },
    });

    expect(result.ok && result.value.metadata.phone).toBe(redactedMetadataValue);
    expect(result.ok && result.value.metadata.audioUrl).toBe(redactedMetadataValue);
    expect(result.ok && result.value.metadata.safe).toBe("ok");
  });

  it("allows draft to awaiting_approval to approved to queued transitions", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallSessionRepository();
    const created = await createCallSession({
      context,
      repository,
      callId: "call-transition-ok",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });
    if (!created.ok) {
      throw new Error("call session should be created");
    }

    const awaiting = await transitionCallStatus({
      context,
      sessionRepository: repository,
      callId: created.value.callId,
      nextStatus: "awaiting_approval",
    });
    const approved = await transitionCallStatus({
      context,
      sessionRepository: repository,
      callId: created.value.callId,
      nextStatus: "approved",
    });
    const queued = await transitionCallStatus({
      context,
      sessionRepository: repository,
      callId: created.value.callId,
      nextStatus: "queued",
    });

    expect(awaiting.ok).toBe(true);
    expect(approved.ok).toBe(true);
    expect(queued.ok && queued.value.status).toBe("queued");
  });

  it("rejects invalid call status transitions", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallSessionRepository();
    const created = await createCallSession({
      context,
      repository,
      callId: "call-transition-invalid",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });
    if (!created.ok) {
      throw new Error("call session should be created");
    }

    const result = await transitionCallStatus({
      context,
      sessionRepository: repository,
      callId: created.value.callId,
      nextStatus: "completed",
    });

    expect(result.ok).toBe(false);
  });

  it("registers call events with correlationId and sanitized metadata", async () => {
    const { context } = createVoiceTestContext();
    const callId = requiredCallId("call-event-001");

    const event = await registerCallEvent({
      context,
      repository: new InMemoryCallEventRepository(),
      callId,
      type: "call.created",
      metadata: { token: "value", safe: "ok" },
    });

    expect(event.correlationId).toBe(context.correlationId);
    expect(event.metadata.token).toBe(redactedMetadataValue);
    expect(event.metadata.safe).toBe("ok");
  });

  it("rejects raw transcript and audio metadata on conversation turns", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallSessionRepository();
    const created = await createCallSession({
      context,
      repository,
      callId: "call-turn-rejects-raw",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });
    if (!created.ok) {
      throw new Error("call session should be created");
    }

    const rawTranscript = await recordConversationTurn({
      context,
      repository,
      callId: created.value.callId,
      role: "user",
      contentRedacted: "redacted content",
      metadata: { rawTranscript: "raw content" },
    });
    const audioUrl = await recordConversationTurn({
      context,
      repository,
      callId: created.value.callId,
      role: "user",
      contentRedacted: "redacted content",
      metadata: { audioUrl: "https://example.invalid/audio.wav" },
    });

    expect(rawTranscript.ok).toBe(false);
    expect(audioUrl.ok).toBe(false);
  });

  it("closes call sessions with endedAt and allowed terminal status", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallSessionRepository();
    const created = await createCallSession({
      context,
      repository,
      callId: "call-close-001",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });
    if (!created.ok) {
      throw new Error("call session should be created");
    }

    const closed = await closeCallSession({
      context,
      repository,
      callId: created.value.callId,
      status: "completed",
    });

    expect(closed.ok && closed.value.status).toBe("completed");
    expect(closed.ok && closed.value.endedAt).toEqual(context.occurredAt);
  });

  it("prepares call orchestration by loading context from a port", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallSessionRepository();
    const created = await createCallSession({
      context,
      repository,
      callId: "call-orchestration-001",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });
    if (!created.ok) {
      throw new Error("call session should be created");
    }

    const plan = await prepareCallOrchestration({
      context,
      callId: created.value.callId,
      sessionRepository: repository,
      contextLoader: new FakeCallContextLoader(),
    });

    expect(plan.ok && plan.value.context.tenantId).toBe("tenant-alpha");
    expect(plan.ok && plan.value.objective).toBe("faq");
  });

  it("decides a respond turn with a fake response generator", async () => {
    const decision = await decideNextTurn({
      callContext: syntheticCallContext(),
      textRedacted: "question",
      intentEngine: new FakeIntentEngine({ objective: "faq", confidence: 0.8 }),
      responseGenerator: new FakeResponseGenerator("redacted answer"),
    });

    expect(decision.ok && decision.value.action).toBe("respond");
    expect(decision.ok && decision.value.responseTextRedacted).toBe("redacted answer");
  });

  it("decides handoff when the fake intent requests it", async () => {
    const decision = await decideNextTurn({
      callContext: syntheticCallContext(),
      textRedacted: "human please",
      intentEngine: new FakeIntentEngine({
        objective: "handoff",
        confidence: 0.95,
        shouldHandoff: true,
      }),
      responseGenerator: new FakeResponseGenerator("unused"),
    });

    expect(decision.ok && decision.value.action).toBe("handoff");
    expect(decision.ok && decision.value.handoffReason).toBe("intent_policy");
  });

  it("applies turn decisions by recording turns and events without runtime", async () => {
    const { context } = createVoiceTestContext();
    const sessionRepository = new InMemoryCallSessionRepository();
    const eventRepository = new InMemoryCallEventRepository();
    const created = await createCallSession({
      context,
      repository: sessionRepository,
      callId: "call-apply-turn-001",
      direction: "outbound",
      participants: createVoiceParticipants(),
    });
    if (!created.ok) {
      throw new Error("call session should be created");
    }

    const applied = await applyTurnDecision({
      context,
      callId: created.value.callId,
      sessionRepository,
      eventRepository,
      decision: { action: "respond", responseTextRedacted: "redacted answer", metadata: {} },
    });
    const turns = await sessionRepository.findTurns(context.tenantId, created.value.callId);
    const events = await eventRepository.findByCall(context.tenantId, created.value.callId);

    expect(applied.ok).toBe(true);
    expect(turns).toHaveLength(1);
    expect(events).toHaveLength(1);
  });

  it("prepares outbound launches with safe callee and caller aliases", () => {
    const { context } = createVoiceTestContext();
    const request = prepareOutboundCallLaunch({
      context,
      callId: requiredCallId("call-launch-001"),
      calleeAlias: "cedco-user-001",
      callerAlias: "cedco-did-main",
      purpose: "Synthetic outreach",
      metadata: { campaign: "synthetic" },
    });

    expect(request.ok && request.value.calleeAlias).toBe("cedco-user-001");
    expect(request.ok && request.value.callerAlias).toBe("cedco-did-main");
  });

  it("rejects real phone metadata in outbound launch preparation", () => {
    const { context } = createVoiceTestContext();
    const request = prepareOutboundCallLaunch({
      context,
      callId: requiredCallId("call-launch-pii"),
      calleeAlias: "cedco-user-001",
      callerAlias: "cedco-did-main",
      purpose: "Synthetic outreach",
      metadata: { phone: "+573001112233" },
    });

    expect(request.ok).toBe(false);
  });

  it("rejects dispatch to real providers when realCallsEnabled is false", async () => {
    const { context, operator } = createVoiceTestContext();
    const request = requiredLaunchRequest("call-real-provider-disabled");

    const result = await dispatchOutboundCall({
      context,
      actor: operator,
      request,
      provider: new ContractOnlyRealProvider(),
      contactResolver: new FakeContactResolver(),
      providerConfig: realProviderConfig(),
      sipTrunkReadiness: verifiedSipReadiness(),
      realCallsEnabled: false,
      humanApproved: true,
    });

    expect(result.ok).toBe(false);
  });

  it("allows dispatch with an explicit fake provider", async () => {
    const { context, operator } = createVoiceTestContext();
    const provider = new FakeCallProvider();

    const result = await dispatchOutboundCall({
      context,
      actor: operator,
      request: requiredLaunchRequest("call-fake-provider"),
      provider,
      contactResolver: new FakeContactResolver(),
      providerConfig: fakeProviderConfig(),
      realCallsEnabled: false,
      humanApproved: true,
    });

    expect(result.ok && result.value.accepted).toBe(true);
    expect(provider.runtimeTargets).toHaveLength(1);
  });

  it("resolves contact targets at runtime without persisting E.164 numbers", async () => {
    const { context, operator } = createVoiceTestContext();
    const provider = new FakeCallProvider();

    const result = await dispatchOutboundCall({
      context,
      actor: operator,
      request: requiredLaunchRequest("call-non-persistable-target"),
      provider,
      contactResolver: new FakeContactResolver(),
      providerConfig: fakeProviderConfig(),
      realCallsEnabled: false,
      humanApproved: true,
    });

    expect(result.ok).toBe(true);
    expect(provider.runtimeTargets[0]?.e164Number).toBe("+570000000000");
    expect(provider.runtimeTargets[0]?.nonPersistable).toBe(true);
    expect(JSON.stringify(result.ok && result.value.providerCallReference)).not.toContain(
      "+570000000000",
    );
  });

  it("ingests provider call events with sanitized metadata", async () => {
    const { context } = createVoiceTestContext();
    const repository = new InMemoryCallEventRepository();
    const result = await ingestProviderCallEvent({
      context,
      eventRepository: repository,
      event: {
        providerName: "fake",
        providerEventId: "provider-event-001",
        providerCallReference: createProviderCallReference({
          providerName: "fake",
          providerCallId: "provider-call-001",
        }),
        callId: requiredCallId("call-provider-event-001"),
        type: "provider.ringing",
        status: "ringing",
        metadata: { email: "person@example.invalid", safe: "ok" },
        occurredAt: context.occurredAt,
      },
    });

    const events = await repository.findByCall(
      context.tenantId,
      requiredCallId("call-provider-event-001"),
    );
    expect(result.metadata.email).toBe(redactedMetadataValue);
    expect(events[0]?.metadata.email).toBe(redactedMetadataValue);
  });

  it("requires verified post-call webhook signatures", async () => {
    const { context } = createVoiceTestContext();
    const callId = requiredCallId("call-post-call-signature");
    const result = await ingestPostCallResult({
      context,
      envelope: postCallEnvelope(callId, false),
      result: {
        callId,
        status: "completed",
        metadata: { safe: "ok" },
      },
    });

    expect(result.ok).toBe(false);
  });

  it("rejects raw post-call transcript, audio, phone, and email data", async () => {
    const { context } = createVoiceTestContext();
    const callId = requiredCallId("call-post-call-pii");

    const rawTranscript = await ingestPostCallResult({
      context,
      envelope: postCallEnvelope(callId, true),
      result: { callId, status: "completed", metadata: { rawTranscript: "raw text" } },
    });
    const audioUrl = await ingestPostCallResult({
      context,
      envelope: postCallEnvelope(callId, true),
      result: {
        callId,
        status: "completed",
        metadata: { audioUrl: "https://example.invalid/a.wav" },
      },
    });
    const phone = await ingestPostCallResult({
      context,
      envelope: postCallEnvelope(callId, true),
      result: { callId, status: "completed", metadata: { phone: "+573001112233" } },
    });
    const email = await ingestPostCallResult({
      context,
      envelope: postCallEnvelope(callId, true),
      result: { callId, status: "completed", metadata: { email: "person@example.invalid" } },
    });

    expect(rawTranscript.ok).toBe(false);
    expect(audioUrl.ok).toBe(false);
    expect(phone.ok).toBe(false);
    expect(email.ok).toBe(false);
  });

  it("requires verified SIP trunk readiness for future real routes", () => {
    const { operator } = createVoiceTestContext();
    const result = validateCallDispatchPolicy({
      actor: operator,
      providerConfig: realProviderConfig(),
      sipTrunkReadiness: { ...verifiedSipReadiness(), verified: false },
      realCallsEnabled: true,
      humanApproved: true,
    });

    expect(result.ok).toBe(false);
  });

  it("allows es-CO voice profiles", () => {
    expect(validateVoiceProfile(voiceProfile({ locale: "es-CO" })).ok).toBe(true);
  });

  it("rejects empty voice locales", () => {
    expect(validateVoiceProfile(voiceProfile({ locale: "" as VoiceProfile["locale"] })).ok).toBe(
      false,
    );
  });

  it("validates turn taking policy timings", () => {
    const valid: TurnTakingPolicy = {
      allowBargeIn: true,
      maxSilenceMs: 1200,
      maxTurnDurationMs: 15000,
      interruptionStrategy: "pause",
    };
    const invalid: TurnTakingPolicy = { ...valid, maxSilenceMs: 0 };

    expect(validateTurnTakingPolicy(valid).ok).toBe(true);
    expect(validateTurnTakingPolicy(invalid).ok).toBe(false);
  });

  it("uses fake STT and TTS without network", async () => {
    const transcript = await new FakeSpeechToText().transcribeRedacted({
      tenantId: "tenant-alpha",
      callId: "call-speech-001",
      audioRef: "fake-audio-ref",
    });
    const synthesis = await new FakeTextToSpeech().synthesize({
      tenantId: "tenant-alpha",
      textRedacted: "synthetic response",
      voiceProfile: voiceProfile(),
    });

    expect(transcript.redacted).toBe(true);
    expect(synthesis.audioRef).toContain("synthetic-audio");
  });

  it("creates handoff requests with redacted summaries", async () => {
    const { context, manager } = createVoiceTestContext();
    const result = await createHandoffRequest({
      context,
      actor: manager,
      repository: new InMemoryHandoffRepository(),
      callId: requiredCallId("call-handoff-001"),
      priority: "high",
      reason: "user_requested_human",
      targetQueue: "cedco-support",
      redactedSummary: "User requested human support.",
    });

    expect(result.ok && result.value.status).toBe("requested");
    expect(result.ok && result.value.redactedSummary).toContain("human support");
  });

  it("rejects raw handoff summaries and sensitive metadata", async () => {
    const { context, manager } = createVoiceTestContext();
    const rawSummary = await createHandoffRequest({
      context,
      actor: manager,
      repository: new InMemoryHandoffRepository(),
      callId: requiredCallId("call-handoff-raw-summary"),
      priority: "high",
      reason: "policy_risk",
      targetQueue: "cedco-support",
      redactedSummary: "raw transcript: user said private content",
    });
    const rawMetadata = await createHandoffRequest({
      context,
      actor: manager,
      repository: new InMemoryHandoffRepository(),
      callId: requiredCallId("call-handoff-raw-metadata"),
      priority: "high",
      reason: "policy_risk",
      targetQueue: "cedco-support",
      redactedSummary: "Redacted summary only.",
      metadata: { rawTranscript: "raw content" },
    });

    expect(rawSummary.ok).toBe(false);
    expect(rawMetadata.ok).toBe(false);
  });

  it("requires voice:handoff:manage to assign handoffs", async () => {
    const { context, manager, viewer } = createVoiceTestContext();
    const repository = new InMemoryHandoffRepository();
    const created = await createHandoffRequest({
      context,
      actor: manager,
      repository,
      callId: requiredCallId("call-handoff-assign-auth"),
      priority: "normal",
      reason: "low_confidence",
      targetQueue: "cedco-support",
      redactedSummary: "Low confidence response.",
    });
    if (!created.ok) {
      throw new Error("handoff should be created");
    }

    const assigned = await assignHandoff({
      context,
      actor: viewer,
      repository,
      handoffId: created.value.handoffId,
      assignedToActorId: "actor-human",
    });

    expect(assigned.ok).toBe(false);
  });

  it("records feedback when resolving handoffs", async () => {
    const { context, manager } = createVoiceTestContext();
    const repository = new InMemoryHandoffRepository();
    const feedbackRepository = new InMemoryFeedbackRepository();
    const created = await createHandoffRequest({
      context,
      actor: manager,
      repository,
      callId: requiredCallId("call-handoff-feedback"),
      priority: "normal",
      reason: "low_confidence",
      targetQueue: "cedco-support",
      redactedSummary: "Low confidence response.",
    });
    if (!created.ok) {
      throw new Error("handoff should be created");
    }

    const resolved = await resolveHandoff({
      context,
      actor: manager,
      repository,
      handoffId: created.value.handoffId,
      feedbackRepository,
    });
    const feedback = await feedbackRepository.findByTenant(context.tenantId);

    expect(resolved.ok && resolved.value.status).toBe("resolved");
    expect(feedback).toHaveLength(1);
    expect(feedback[0]?.outcome).toBe("resolved");
  });

  it("supports handoff status flow requested to assigned to resolved", async () => {
    const { context, manager } = createVoiceTestContext();
    const repository = new InMemoryHandoffRepository();
    const created = await createHandoffRequest({
      context,
      actor: manager,
      repository,
      callId: requiredCallId("call-handoff-flow"),
      priority: "normal",
      reason: "unknown_intent",
      targetQueue: "cedco-support",
      redactedSummary: "Unknown intent, operator needed.",
    });
    if (!created.ok) {
      throw new Error("handoff should be created");
    }

    const assigned = await assignHandoff({
      context,
      actor: manager,
      repository,
      handoffId: created.value.handoffId,
      assignedToActorId: "actor-human",
    });
    const resolved = await resolveHandoff({
      context,
      actor: manager,
      repository,
      handoffId: created.value.handoffId,
    });

    expect(created.value.status).toBe("requested");
    expect(assigned.ok && assigned.value.status).toBe("assigned");
    expect(resolved.ok && resolved.value.status).toBe("resolved");
  });
});

function requiredCallId(value: string) {
  const callId = createCallId(value);
  if (!callId.ok) {
    throw new Error(`invalid test call id: ${value}`);
  }
  return callId.value;
}

function syntheticCallContext(): CallContext {
  return {
    callId: requiredCallId("call-context-001"),
    tenantId: "tenant-alpha",
    agentRuntimeRef: { agentVersionId: "agent-version-test" },
    knowledgeRuntimeRef: "knowledge-version-test",
    objective: "faq",
    safeFacts: { topic: "synthetic" },
    metadata: { source: "test" },
  };
}

function requiredLaunchRequest(callId: string): OutboundCallLaunchRequest {
  const { context } = createVoiceTestContext();
  const request = prepareOutboundCallLaunch({
    context,
    callId: requiredCallId(callId),
    calleeAlias: "cedco-user-001",
    callerAlias: "cedco-did-main",
    purpose: "Synthetic outreach",
  });
  if (!request.ok) {
    throw new Error("launch request should be valid");
  }
  return request.value;
}

function fakeProviderConfig(): CallProviderConfig {
  return {
    providerName: "fake-call-provider",
    providerKind: "fake",
    configured: true,
  };
}

function realProviderConfig(): CallProviderConfig {
  return {
    providerName: "contract-only-provider",
    providerKind: "sip_trunk",
    configured: true,
  };
}

function verifiedSipReadiness(): SipTrunkReadiness {
  return {
    providerName: "contract-only-provider",
    trunkAlias: "contract-trunk",
    outboundEnabled: true,
    tlsRequired: true,
    mediaEncryptionPreferred: true,
    codecAllowlist: ["G711", "G722"],
    verified: true,
    metadata: {},
  };
}

function postCallEnvelope(callId: ReturnType<typeof requiredCallId>, signatureVerified: boolean) {
  return {
    providerName: "fake",
    providerEventId: "post-call-event-001",
    providerCallReference: createProviderCallReference({
      providerName: "fake",
      providerCallId: "provider-call-001",
    }),
    callId,
    receivedAt: new Date("2026-06-26T00:00:00.000Z"),
    signatureVerified,
    payloadMetadata: { safe: "ok" },
  };
}

function voiceProfile(overrides: Partial<VoiceProfile> = {}): VoiceProfile {
  return {
    voiceProfileId: "voice-profile-001",
    tenantId: "tenant-alpha",
    locale: "es-CO",
    displayName: "Synthetic voice",
    metadata: {},
    ...overrides,
  };
}

class ContractOnlyRealProvider implements CallProviderPort {
  readonly providerName = "contract-only-provider";
  readonly providerKind = "sip_trunk";

  async prepareOutboundCall(request: OutboundCallLaunchRequest): Promise<OutboundCallLaunchResult> {
    return {
      accepted: true,
      providerCallReference: createProviderCallReference({
        providerName: this.providerName,
        providerCallId: `contract-prepared-${request.callId}`,
      }),
    };
  }

  async dispatchOutboundCall(
    request: OutboundCallLaunchRequest,
    _runtimeContactTarget: RuntimeContactTarget,
  ): Promise<OutboundCallLaunchResult> {
    return {
      accepted: true,
      providerCallReference: createProviderCallReference({
        providerName: this.providerName,
        providerCallId: `contract-dispatched-${request.callId}`,
      }),
    };
  }

  async cancelOutboundCall(_providerCallId: string): Promise<OutboundCallLaunchResult> {
    return { accepted: true };
  }

  async ingestProviderEvent(event: Parameters<CallProviderPort["ingestProviderEvent"]>[0]) {
    return event;
  }

  async ingestPostCallWebhook(envelope: Parameters<CallProviderPort["ingestPostCallWebhook"]>[0]) {
    return envelope;
  }
}
