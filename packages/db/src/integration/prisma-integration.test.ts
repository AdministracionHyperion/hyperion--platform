import { describe, expect, it, beforeAll, afterAll, afterEach } from "vitest";

import { redactedMetadataValue } from "../../../shared/src/core";
import {
  PrismaAgentRepository,
  PrismaAgentVersionRepository,
} from "../repositories/agent-platform";
import {
  PrismaAuditLogRepository,
  PrismaFeatureFlagRepository,
  PrismaFeedbackRepository,
  PrismaTenantRepository,
  PrismaVersionRepository,
} from "../repositories/core";
import {
  PrismaCedcoAgreementRepository,
  PrismaCedcoD02ConfigurationRepository,
  PrismaCedcoD02MetricsRepository,
  PrismaCedcoServiceRepository,
  PrismaCedcoSiteRepository,
} from "../repositories/products/cedco/d02-calls";
import {
  PrismaCallEventRepository,
  PrismaCallSessionRepository,
  PrismaHandoffRepository,
} from "../repositories/voice";
import {
  PrismaKnowledgeRepository,
  PrismaKnowledgeVersionRepository,
} from "../repositories/agent-platform";
import {
  PrismaPromptRepository,
  PrismaPromptVersionRepository,
} from "../repositories/agent-platform";
import { getIntegrationDatabaseUrl } from "./db-test-url";
import { createPrismaTestHarness, type PrismaTestHarness } from "./prisma-test-harness";

const databaseUrl = getIntegrationDatabaseUrl();
const describeDb = databaseUrl ? describe : describe.skip;
const occurredAt = new Date("2026-01-01T00:00:00.000Z");

describeDb("Prisma PostgreSQL integration", () => {
  let harness: PrismaTestHarness;
  let tenantRepository: PrismaTenantRepository;
  let auditLogRepository: PrismaAuditLogRepository;
  let featureFlagRepository: PrismaFeatureFlagRepository;
  let versionRepository: PrismaVersionRepository;
  let feedbackRepository: PrismaFeedbackRepository;
  let agentRepository: PrismaAgentRepository;
  let agentVersionRepository: PrismaAgentVersionRepository;
  let promptRepository: PrismaPromptRepository;
  let promptVersionRepository: PrismaPromptVersionRepository;
  let knowledgeRepository: PrismaKnowledgeRepository;
  let knowledgeVersionRepository: PrismaKnowledgeVersionRepository;
  let callSessionRepository: PrismaCallSessionRepository;
  let callEventRepository: PrismaCallEventRepository;
  let handoffRepository: PrismaHandoffRepository;
  let cedcoSiteRepository: PrismaCedcoSiteRepository;
  let cedcoServiceRepository: PrismaCedcoServiceRepository;
  let cedcoAgreementRepository: PrismaCedcoAgreementRepository;
  let cedcoConfigurationRepository: PrismaCedcoD02ConfigurationRepository;
  let cedcoMetricsRepository: PrismaCedcoD02MetricsRepository;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for DB integration tests");
    }

    harness = createPrismaTestHarness(databaseUrl);
    await harness.migrate();
    await harness.cleanup();

    tenantRepository = new PrismaTenantRepository(harness.client);
    auditLogRepository = new PrismaAuditLogRepository(harness.client);
    featureFlagRepository = new PrismaFeatureFlagRepository(harness.client);
    versionRepository = new PrismaVersionRepository(harness.client);
    feedbackRepository = new PrismaFeedbackRepository(harness.client);
    agentRepository = new PrismaAgentRepository(harness.client);
    agentVersionRepository = new PrismaAgentVersionRepository(harness.client);
    promptRepository = new PrismaPromptRepository(harness.client);
    promptVersionRepository = new PrismaPromptVersionRepository(harness.client);
    knowledgeRepository = new PrismaKnowledgeRepository(harness.client);
    knowledgeVersionRepository = new PrismaKnowledgeVersionRepository(harness.client);
    callSessionRepository = new PrismaCallSessionRepository(harness.client);
    callEventRepository = new PrismaCallEventRepository(harness.client);
    handoffRepository = new PrismaHandoffRepository(harness.client);
    cedcoSiteRepository = new PrismaCedcoSiteRepository(harness.client);
    cedcoServiceRepository = new PrismaCedcoServiceRepository(harness.client);
    cedcoAgreementRepository = new PrismaCedcoAgreementRepository(harness.client);
    cedcoConfigurationRepository = new PrismaCedcoD02ConfigurationRepository(harness.client);
    cedcoMetricsRepository = new PrismaCedcoD02MetricsRepository(harness.client);
  }, 60_000);

  afterEach(async () => {
    await harness.cleanup();
  });

  afterAll(async () => {
    await harness.cleanup();
    await harness.disconnect();
  });

  it("applies migration and Prisma can query Tenant", async () => {
    await expect(harness.client.tenant.count()).resolves.toBe(0);
  });

  it("PrismaTenantRepository creates and reads a tenant", async () => {
    await seedTenant();

    const tenant = await tenantRepository.findById("cedco-test" as never);

    expect(tenant?.tenantId).toBe("cedco-test");
    expect(tenant?.status).toBe("active");
  });

  it("TenantMembership roundtrip preserves tenantId, userId and roles", async () => {
    await seedTenant();
    await seedUser();

    await harness.client.tenantMembership.create({
      data: {
        id: "membership-test",
        tenantId: "cedco-test",
        userId: "actor-test",
        roles: ["tenant-admin", "voice-manager"],
        status: "active",
      },
    });

    const membership = await harness.client.tenantMembership.findUnique({
      where: { id: "membership-test" },
    });

    expect(membership?.tenantId).toBe("cedco-test");
    expect(membership?.userId).toBe("actor-test");
    expect(membership?.roles).toEqual(["tenant-admin", "voice-manager"]);
  });

  it("PrismaAuditLogRepository stores audit log with correlationId", async () => {
    await auditLogRepository.append(auditEvent({ metadata: {} } as never));

    const events = await auditLogRepository.findByTenant("cedco-test");

    expect(events).toHaveLength(1);
    expect(events[0]?.correlationId).toBe("corr-test-001");
  });

  it("audit metadata is sanitized before persistence", async () => {
    await auditLogRepository.append(
      auditEvent({
        metadata: { phone: "synthetic", rawTranscript: "synthetic", audioUrl: "synthetic" },
      } as never),
    );

    const row = await harness.client.auditLog.findFirstOrThrow();
    const metadata = row.metadata as Record<string, unknown>;

    expect(metadata.phone).toBe(redactedMetadataValue);
    expect(metadata.rawTranscript).toBe(redactedMetadataValue);
    expect(metadata.audioUrl).toBe(redactedMetadataValue);
  });

  it("PrismaFeatureFlagRepository reads tenant-scoped flag", async () => {
    await featureFlagRepository.save({
      tenantId: "cedco-test",
      flagKey: "cedco-d02-enabled",
      enabled: true,
      description: "Synthetic test flag",
      createdAt: occurredAt,
    } as never);

    const flag = await featureFlagRepository.findByKey("cedco-d02-enabled", "cedco-test");

    expect(flag?.enabled).toBe(true);
    expect(flag?.tenantId).toBe("cedco-test");
  });

  it("PrismaVersionRepository stores draft and active versions", async () => {
    await versionRepository.save(versionedResource("version-draft", "draft", 1));
    await versionRepository.save(versionedResource("version-active", "active", 2));

    const versions = await versionRepository.findByResource("cedco-test", "agent", "agent-test");

    expect(versions.map((version) => version.status)).toEqual(["draft", "active"]);
  });

  it("PrismaFeedbackRepository stores sanitized feedback", async () => {
    await feedbackRepository.save({
      feedbackEventId: "feedback-test",
      tenantId: "cedco-test",
      actorId: "actor-test",
      correlationId: "corr-test-001",
      source: "human",
      resourceType: "call",
      resourceId: "call-test-001",
      outcome: "needs_review",
      score: 0.5,
      metadata: { audioUrl: "synthetic" },
      occurredAt,
    } as never);

    const row = await harness.client.feedbackEvent.findFirstOrThrow();

    expect((row.metadata as Record<string, unknown>).audioUrl).toBe(redactedMetadataValue);
  });

  it("PrismaAgentRepository creates and reads Agent", async () => {
    await agentRepository.save(agent());

    const saved = await agentRepository.findById("cedco-test", "agent-test" as never);

    expect(saved?.tenantId).toBe("cedco-test");
    expect(saved?.agentId).toBe("agent-test");
  });

  it("PrismaAgentVersionRepository creates and reads AgentVersion", async () => {
    await agentVersionRepository.save(agentVersion());

    const saved = await agentVersionRepository.findById(
      "cedco-test",
      "agent-version-test" as never,
    );

    expect(saved?.agentId).toBe("agent-test");
    expect(saved?.capabilities).toEqual(["conversation.context", "knowledge.retrieve"]);
  });

  it("PrismaPromptRepository creates and reads PromptTemplate", async () => {
    await promptRepository.save(promptTemplate());

    const saved = await promptRepository.findById("cedco-test", "prompt-test" as never);

    expect(saved?.promptId).toBe("prompt-test");
    expect(saved?.tenantId).toBe("cedco-test");
  });

  it("PrismaPromptVersionRepository creates and reads PromptVersion", async () => {
    await promptVersionRepository.save(promptVersion());

    const saved = await promptVersionRepository.findById(
      "cedco-test",
      "prompt-version-test" as never,
    );

    expect(saved?.template).toContain("synthetic");
    expect(saved?.policy.allowSecrets).toBe(false);
  });

  it("PrismaKnowledgeRepository creates and reads KnowledgeBase", async () => {
    await knowledgeRepository.saveKnowledgeBase(knowledgeBase());

    const saved = await knowledgeRepository.findKnowledgeBase("cedco-test", "kb-test" as never);

    expect(saved?.knowledgeBaseId).toBe("kb-test");
  });

  it("PrismaKnowledgeVersionRepository creates and reads KnowledgeBaseVersion", async () => {
    await knowledgeVersionRepository.save(knowledgeBaseVersion());

    const saved = await knowledgeVersionRepository.findById(
      "cedco-test",
      "kb-version-test" as never,
    );

    expect(saved?.retrievalPolicy.allowCrossTenant).toBe(false);
  });

  it("PrismaCallSessionRepository creates and reads CallSession with correlationId", async () => {
    await callSessionRepository.save(callSession());

    const saved = await callSessionRepository.findById("cedco-test", "call-test-001" as never);

    expect(saved?.correlationId).toBe("corr-test-001");
    expect(saved?.status).toBe("queued");
  });

  it("PrismaCallEventRepository creates and reads CallEvent", async () => {
    await callEventRepository.append(callEvent({ metadata: {} } as never));

    const events = await callEventRepository.findByCall("cedco-test", "call-test-001" as never);

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("call.status_changed");
  });

  it("PrismaHandoffRepository creates and reads HandoffRequest", async () => {
    await handoffRepository.save(handoffRequest());

    const saved = await handoffRepository.findById("cedco-test", "handoff-test" as never);

    expect(saved?.redactedSummary).toBe("Synthetic handoff summary.");
  });

  it("PrismaCedcoSiteRepository creates and reads a site", async () => {
    await cedcoSiteRepository.save(cedcoSite());

    const saved = await cedcoSiteRepository.findById("cedco-test", "bucaramanga" as never);

    expect(saved?.siteId).toBe("bucaramanga");
  });

  it("PrismaCedcoServiceRepository creates and reads service availableSiteIds", async () => {
    await cedcoServiceRepository.save(cedcoService());

    const saved = await cedcoServiceRepository.findById(
      "cedco-test",
      "odontologia-general-test" as never,
    );

    expect(saved?.availableSiteIds).toEqual(["bucaramanga"]);
  });

  it("PrismaCedcoAgreementRepository creates and reads an agreement", async () => {
    await cedcoAgreementRepository.save(cedcoAgreement());

    const saved = await cedcoAgreementRepository.findById("cedco-test", "convenio-test" as never);

    expect(saved?.applicableServiceIds).toEqual(["odontologia-general-test"]);
  });

  it("PrismaCedcoD02ConfigurationRepository keeps realCallsEnabled false", async () => {
    await cedcoConfigurationRepository.save(cedcoConfiguration());

    const saved = await cedcoConfigurationRepository.findByTenant("cedco-test");

    expect(saved?.realCallsEnabled).toBe(false);
  });

  it("PrismaCedcoD02MetricsRepository stores sanitized metric dimensions", async () => {
    await cedcoMetricsRepository.record({
      metricId: "metric-test",
      tenantId: "cedco-test",
      key: "d02.integration.test",
      value: 1,
      dimensions: { phone: "synthetic" },
      occurredAt,
    });

    const rows = await cedcoMetricsRepository.summarizeByTenant("cedco-test");

    expect(rows[0]?.dimensions.phone).toBe(redactedMetadataValue);
  });

  it("cross-tenant query does not return data from another tenant", async () => {
    await cedcoSiteRepository.save(cedcoSite());

    const saved = await cedcoSiteRepository.findById("other-tenant", "bucaramanga" as never);

    expect(saved).toBeNull();
  });

  it("does not persist phone, transcript or audio metadata after sanitizer", async () => {
    await callEventRepository.append(
      callEvent({
        metadata: { phone: "synthetic", rawTranscript: "synthetic", audioUrl: "synthetic" },
      } as never),
    );

    const row = await harness.client.callEvent.findFirstOrThrow();
    const metadata = row.metadata as Record<string, unknown>;

    expect(metadata.phone).toBe(redactedMetadataValue);
    expect(metadata.rawTranscript).toBe(redactedMetadataValue);
    expect(metadata.audioUrl).toBe(redactedMetadataValue);
  });

  it("OutboxEvent can be inserted and queried directly", async () => {
    await harness.client.outboxEvent.create({
      data: {
        id: "outbox-test",
        tenantId: "cedco-test",
        actorId: "actor-test",
        correlationId: "corr-test-001",
        type: "test.event",
        payload: { ok: true },
        status: "pending",
        occurredAt,
      },
    });

    const event = await harness.client.outboxEvent.findUnique({ where: { id: "outbox-test" } });

    expect(event?.correlationId).toBe("corr-test-001");
  });

  it("cleanup leaves test tables empty", async () => {
    await seedTenant();
    await harness.client.outboxEvent.create({
      data: {
        id: "outbox-cleanup-test",
        tenantId: "cedco-test",
        correlationId: "corr-test-001",
        type: "cleanup.event",
        payload: {},
        status: "pending",
        occurredAt,
      },
    });

    await harness.cleanup();

    await expect(countPersistedRows()).resolves.toBe(0);
  });

  async function seedTenant(): Promise<void> {
    await tenantRepository.save({
      tenantId: "cedco-test",
      name: "CEDCO Test",
      status: "active",
      createdAt: occurredAt,
      updatedAt: occurredAt,
    } as never);
  }

  async function seedUser(): Promise<void> {
    await harness.client.user.create({
      data: {
        id: "actor-test",
        displayName: "Synthetic Actor",
        status: "active",
        metadata: {},
      },
    });
  }

  function auditEvent(input: { readonly metadata: Record<string, unknown> }) {
    return {
      auditEventId: "audit-test",
      tenantId: "cedco-test",
      actorId: "actor-test",
      correlationId: "corr-test-001",
      action: "tenant.created",
      resourceType: "tenant",
      resourceId: "cedco-test",
      result: "success",
      metadata: input.metadata,
      occurredAt,
    } as never;
  }

  function versionedResource(id: string, status: "draft" | "active", versionNumber: number) {
    return {
      versionId: id,
      tenantId: "cedco-test",
      resourceType: "agent",
      resourceId: "agent-test",
      versionNumber,
      status,
      createdBy: "actor-test",
      createdAt: occurredAt,
      activatedAt: status === "active" ? occurredAt : undefined,
    } as never;
  }

  function agent() {
    return {
      agentId: "agent-test",
      tenantId: "cedco-test",
      name: "Synthetic Agent",
      description: "Synthetic D02 agent",
      status: "draft",
      defaultLocale: "es-CO",
      createdBy: "actor-test",
      createdAt: occurredAt,
      updatedAt: occurredAt,
      metadata: {},
    } as never;
  }

  function agentVersion() {
    return {
      agentVersionId: "agent-version-test",
      tenantId: "cedco-test",
      agentId: "agent-test",
      versionNumber: 1,
      status: "draft",
      capabilities: ["conversation.context", "knowledge.retrieve"],
      createdBy: "actor-test",
      createdAt: occurredAt,
    } as never;
  }

  function promptTemplate() {
    return {
      promptId: "prompt-test",
      tenantId: "cedco-test",
      name: "Synthetic Prompt",
      description: "Synthetic prompt template",
      scope: "agent",
      createdBy: "actor-test",
      createdAt: occurredAt,
      updatedAt: occurredAt,
    } as never;
  }

  function promptVersion() {
    return {
      promptVersionId: "prompt-version-test",
      tenantId: "cedco-test",
      promptId: "prompt-test",
      versionNumber: 1,
      status: "draft",
      template: "Respond with synthetic CEDCO context only.",
      variables: [],
      policy: {
        allowPii: false,
        allowSecrets: false,
        allowProviderSpecificKeys: false,
        allowHardcodedPhoneNumbers: false,
      },
      createdBy: "actor-test",
      createdAt: occurredAt,
    } as never;
  }

  function knowledgeBase() {
    return {
      knowledgeBaseId: "kb-test",
      tenantId: "cedco-test",
      name: "Synthetic KB",
      description: "Synthetic knowledge base",
      createdBy: "actor-test",
      createdAt: occurredAt,
      updatedAt: occurredAt,
    } as never;
  }

  function knowledgeBaseVersion() {
    return {
      knowledgeBaseVersionId: "kb-version-test",
      tenantId: "cedco-test",
      knowledgeBaseId: "kb-test",
      versionNumber: 1,
      status: "draft",
      retrievalPolicy: {
        topK: 3,
        minScore: 0.8,
        allowCrossTenant: false,
        citeSources: true,
      },
      createdBy: "actor-test",
      createdAt: occurredAt,
    } as never;
  }

  function callSession() {
    return {
      callId: "call-test-001",
      tenantId: "cedco-test",
      direction: "outbound",
      status: "queued",
      participants: [],
      correlationId: "corr-test-001",
      metadata: {},
      createdAt: occurredAt,
      updatedAt: occurredAt,
      turns: [],
    } as never;
  }

  function callEvent(input: { readonly metadata: Record<string, unknown> }) {
    return {
      callEventId: "call-event-test",
      callId: "call-test-001",
      tenantId: "cedco-test",
      actorId: "actor-test",
      correlationId: "corr-test-001",
      type: "call.status_changed",
      status: "queued",
      metadata: input.metadata,
      occurredAt,
    } as never;
  }

  function handoffRequest() {
    return {
      handoffId: "handoff-test",
      tenantId: "cedco-test",
      callId: "call-test-001",
      status: "requested",
      priority: "normal",
      reason: "Synthetic handoff",
      targetQueue: "cedco-test-queue",
      redactedSummary: "Synthetic handoff summary.",
      metadata: {},
      createdAt: occurredAt,
    } as never;
  }

  function cedcoSite() {
    return {
      siteId: "bucaramanga",
      tenantId: "cedco-test",
      name: "Bucaramanga",
      city: "Bucaramanga",
      status: "active",
      timezone: "America/Bogota",
      metadata: {},
    } as never;
  }

  function cedcoService() {
    return {
      serviceId: "odontologia-general-test",
      tenantId: "cedco-test",
      name: "Odontologia general test",
      category: "general",
      availableSiteIds: ["bucaramanga"],
      requiresEligibilityCheck: true,
      requiresSchedulingIntegration: false,
      metadata: {},
    } as never;
  }

  function cedcoAgreement() {
    return {
      agreementId: "convenio-test",
      tenantId: "cedco-test",
      name: "Convenio test",
      status: "active",
      applicableServiceIds: ["odontologia-general-test"],
      notesRedacted: "Synthetic agreement only.",
      metadata: {},
    } as never;
  }

  function cedcoConfiguration() {
    return {
      tenantId: "cedco-test",
      defaultLocale: "es-CO",
      activeAgentVersionId: "agent-version-test",
      activePromptVersionId: "prompt-version-test",
      activeKnowledgeBaseVersionId: "kb-version-test",
      allowedSiteIds: ["bucaramanga"],
      allowedServiceIds: ["odontologia-general-test"],
      handoffEnabled: true,
      schedulingMode: "mock",
      eligibilityMode: "mock",
      realCallsEnabled: false,
      metadata: {},
    } as never;
  }

  async function countPersistedRows(): Promise<number> {
    const counts = await Promise.all([
      harness.client.tenant.count(),
      harness.client.user.count(),
      harness.client.tenantMembership.count(),
      harness.client.auditLog.count(),
      harness.client.featureFlag.count(),
      harness.client.versionedResource.count(),
      harness.client.feedbackEvent.count(),
      harness.client.outboxEvent.count(),
      harness.client.agent.count(),
      harness.client.agentVersion.count(),
      harness.client.promptTemplate.count(),
      harness.client.promptVersion.count(),
      harness.client.knowledgeBase.count(),
      harness.client.knowledgeBaseVersion.count(),
      harness.client.callSession.count(),
      harness.client.callEvent.count(),
      harness.client.handoffRequest.count(),
      harness.client.cedcoSite.count(),
      harness.client.cedcoService.count(),
      harness.client.cedcoAgreement.count(),
      harness.client.cedcoD02Configuration.count(),
      harness.client.cedcoD02Metric.count(),
    ]);

    return counts.reduce((total, count) => total + count, 0);
  }
});
