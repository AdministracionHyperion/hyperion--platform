import { createOperationContext, sanitizeMetadata } from "../../../../packages/shared/src/core";
import { toPrismaJson, type HyperionPrismaClient } from "../../../../packages/db/src";
import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  sanitizeLogMetadata,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../packages/observability/src";
import {
  createRateLimitRule,
  defaultApiRateLimitRule,
  InMemoryRateLimitStore,
  type RateLimitRule,
} from "../../../../modules/core/rate-limits/src";
import { defaultRuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";
import { classifyCedcoCallIntent } from "../../../../modules/products/cedco/d02-calls/src/use-cases/classify-cedco-call-intent";
import { evaluateCedcoCallReadiness } from "../../../../modules/products/cedco/d02-calls/src/use-cases/evaluate-cedco-call-readiness";
import { evaluateCedcoCompliance } from "../../../../modules/products/cedco/d02-calls/src/use-cases/evaluate-cedco-compliance";
import { evaluateCedcoHandoff } from "../../../../modules/products/cedco/d02-calls/src/use-cases/evaluate-cedco-handoff";
import {
  runCedcoD02InternalDialerDryRun,
  type CedcoD02DialerDryRunInput,
  type CedcoD02DialerDryRunResult,
  type CedcoD02InternalDialerDryRunPort,
  type CedcoD02InternalDialerDryRunRequest,
} from "../../../../modules/products/cedco/d02-calls/src/application/dialer-dry-run";
import {
  runCedcoD02MockCallFlow,
  type CedcoD02MockCallFlowResult,
} from "../../../../modules/products/cedco/d02-calls/src/application/mock-runtime";
import { buildCedcoD02EvalDashboardSummary } from "../../../../modules/products/cedco/d02-calls/src/application/dashboard";
import {
  buildOperationalDashboard,
  type DashboardAuditPreview,
  type DashboardMetric,
  type DashboardMockCallFlow,
  type DashboardProviderEvent,
} from "../../../../modules/core/operations-dashboard/src";
import { MockCallRuntimeAdapter } from "../../../../modules/voice/call-runtime/src";
import {
  BlockedInternalDialerAdapter,
  buildDialerReadinessReport,
  defaultDialerHardeningStatus,
  toInternalDialerDryRunResponse,
  type DialerDispatchRequest,
} from "../../../../modules/integrations/provider-adapters/internal-dialer/src";
import {
  ingestProviderEvent,
  InMemoryReplayProtectionStore,
  MockProviderEventNormalizer,
  MockProviderSignatureVerifier,
  type SanitizedProviderEvent,
} from "../../../../modules/voice/provider-events/src";
import { createActorId } from "../../../../modules/core/identity-access/src";
import { evaluatePolicyGate } from "../../../../modules/core/policy-gates/src";
import type { CedcoCallObjective } from "../../../../modules/products/cedco/d02-calls/src/cedco-call-objective";
import type { CedcoD02Configuration } from "../../../../modules/products/cedco/d02-calls/src/cedco-d02-configuration";
import {
  createPrismaApiComposition,
  type PrismaApiComposition,
} from "../composition/prisma-api-services";
import {
  arrayToPrismaJson,
  metadataToPrismaJson,
  persistedJsonArray,
  persistedMetadata,
} from "../composition/api-prisma-mappers";
import { conflictError, policyBlockedError, validationError } from "../http/api-error";
import type { RequestContext } from "../http/request-context";
import type {
  CedcoConfigurationBody,
  ClassifyCedcoIntentBody,
  CreateAgentBody,
  CreateAgentVersionBody,
  CreateCedcoEligibilityCheckBody,
  CreateCedcoSchedulingRequestBody,
  CreateVoiceCallBody,
  CreateVoiceCallEventBody,
  EvaluateCedcoComplianceBody,
  EvaluateCedcoHandoffBody,
  EvaluateCedcoReadinessBody,
  MockProviderEventBody,
  RunCedcoD02DialerDryRunBody,
  RunCedcoD02MockCallFlowBody,
  InternalDialerDryRunBody,
} from "../contracts";
import type { ApiAuditRecord, ApiServices } from "./api-services";

export interface PrismaBackedApiServicesInput {
  readonly prisma: HyperionPrismaClient;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
  readonly dialerDryRun?: CedcoD02InternalDialerDryRunPort;
}

export function createPrismaBackedApiServices(input: PrismaBackedApiServicesInput): ApiServices {
  return new PrismaBackedApiServices(
    createPrismaApiComposition(input.prisma),
    input.logger,
    input.metrics,
    input.dialerDryRun,
  );
}

class PrismaBackedApiServices implements ApiServices {
  public readonly observability: NonNullable<ApiServices["observability"]>;
  public readonly security: NonNullable<ApiServices["security"]>;
  public readonly core: ApiServices["core"];
  public readonly agentPlatform: ApiServices["agentPlatform"];
  public readonly voice: ApiServices["voice"];
  public readonly cedcoD02: ApiServices["cedcoD02"];
  public readonly operationsDashboard: ApiServices["operationsDashboard"];
  public readonly internalDialer: ApiServices["internalDialer"];
  private readonly providerReplayProtection = new InMemoryReplayProtectionStore();
  private readonly providerNormalizer = new MockProviderEventNormalizer();
  private readonly providerSignatureVerifier = new MockProviderSignatureVerifier();
  private readonly internalDialerAdapter: BlockedInternalDialerAdapter;

  public constructor(
    private readonly composition: PrismaApiComposition,
    logger: LoggerPort = new InMemoryLogger(),
    metrics: MetricsRegistryPort = new InMemoryMetricsRegistry(),
    private readonly dialerDryRun?: CedcoD02InternalDialerDryRunPort,
  ) {
    this.internalDialerAdapter = new BlockedInternalDialerAdapter({
      hardeningStatus: defaultDialerHardeningStatus,
      logger,
      metrics,
    });
    const rateLimitStore = new InMemoryRateLimitStore();
    let testRateLimitRule: RateLimitRule | undefined;
    this.observability = {
      logger,
      metrics,
      recordAuditEvent: (event) => this.recordAuditEvent(event),
    };
    this.security = {
      rateLimitStore,
      runtimeSafetyFlags: defaultRuntimeSafetyFlags,
      getRateLimitRule: (input) =>
        testRateLimitRule ??
        defaultApiRateLimitRule({
          method: input.method,
          route: input.route,
        }),
      setRateLimitRuleForTests: (rule) => {
        testRateLimitRule = createRateLimitRule(rule);
        rateLimitStore.clear();
      },
    };
    this.core = {
      getFeatureFlag: (context, flagKey) => this.getFeatureFlag(context, flagKey),
    };
    this.agentPlatform = {
      createAgent: (context, input) => this.createAgent(context, input),
      createAgentVersion: (context, agentId, input) =>
        this.createAgentVersion(context, agentId, input),
    };
    this.voice = {
      createCall: (context, input) => this.createCall(context, input),
      registerCallEvent: (context, callId, input) => this.registerCallEvent(context, callId, input),
      getCall: (context, callId) => this.getCall(context, callId),
      ingestMockProviderEvent: (context, input, headers) =>
        this.ingestMockProviderEvent(context, input, headers),
    };
    this.cedcoD02 = {
      getConfiguration: (context) => this.getCedcoConfiguration(context),
      updateConfiguration: (context, input) => this.updateCedcoConfiguration(context, input),
      classifyIntent: (_context, input) => this.classifyCedcoIntent(input),
      evaluateReadiness: (context, input) => this.evaluateCedcoReadiness(context, input),
      evaluateCompliance: (_context, input) => this.evaluateCedcoCompliance(input),
      evaluateHandoff: (_context, input) => this.evaluateCedcoHandoff(input),
      createSchedulingRequest: (context, input) =>
        this.createCedcoSchedulingRequest(context, input),
      createEligibilityCheck: (context, input) => this.createCedcoEligibilityCheck(context, input),
      getMetricsSummary: (context) => this.getCedcoMetricsSummary(context),
      runDialerDryRun: (context, input) => this.runCedcoD02DialerDryRun(context, input),
      runMockCallFlow: (context, input) => this.runCedcoD02MockCallFlow(context, input),
    };
    this.operationsDashboard = {
      getDashboard: (context) => this.getOperationsDashboard(context),
      getMockCallFlows: async (context) =>
        (await this.getOperationsDashboard(context)).mockCallFlows,
      getProviderEvents: async (context) =>
        (await this.getOperationsDashboard(context)).providerEvents,
      getEvalSummary: async (context) => (await this.getOperationsDashboard(context)).evalSummary,
    };
    this.internalDialer = {
      getReadiness: (_context) =>
        Promise.resolve(buildDialerReadinessReport(defaultDialerHardeningStatus)),
      dryRun: (context, input) => this.internalDialerDryRun(context, input),
    };
  }

  private get prisma(): HyperionPrismaClient {
    return this.composition.prisma;
  }

  private async recordAuditEvent(event: ApiAuditRecord): Promise<void> {
    if (!event.tenantId) {
      return;
    }

    await this.prisma.auditLog.create({
      data: {
        id: `audit-${event.correlationId}-${event.action}-${Date.now()}`,
        tenantId: event.tenantId,
        actorId: event.actorId,
        correlationId: event.correlationId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        result: event.result,
        metadata: toPrismaJson(sanitizeLogMetadata(event.metadata)),
        occurredAt: event.occurredAt,
      },
    });
  }

  private async internalDialerDryRun(context: RequestContext, input: InternalDialerDryRunBody) {
    const operationContext = createOperationContext({
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      occurredAt: context.occurredAt,
      source: context.source,
    });
    if (!operationContext.ok) {
      throw validationError(operationContext.error.message);
    }

    const result = await this.internalDialerAdapter.dryRun(
      toDialerDispatchRequest(context, input),
      operationContext.value,
    );

    return toInternalDialerDryRunResponse(result);
  }

  private async runCedcoD02DialerDryRun(
    context: RequestContext,
    input: RunCedcoD02DialerDryRunBody,
  ) {
    const operationContext = createOperationContext({
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      occurredAt: context.occurredAt,
      source: context.source,
    });
    if (!operationContext.ok) {
      throw validationError(operationContext.error.message);
    }

    const result = await runCedcoD02InternalDialerDryRun({
      intent: toCedcoD02DialerDryRunIntent(context, input),
      logger: this.observability.logger,
      metrics: this.observability.metrics,
      audit: {
        record: (event) => this.recordAuditEvent(event),
      },
      dialer: {
        dryRun: async (request) =>
          this.dialerDryRun
            ? this.dialerDryRun.dryRun(request)
            : toInternalDialerDryRunResponse(
                await this.internalDialerAdapter.dryRun(
                  toDialerDispatchRequest(context, request),
                  operationContext.value,
                ),
              ),
      },
    });
    if (!result.ok) {
      throw validationError(result.error.message);
    }

    return toCedcoD02DialerDryRunResponse(result.value, this.observability.metrics);
  }

  private async getFeatureFlag(context: RequestContext, flagKey: string) {
    const tenantFlag = await this.prisma.featureFlag.findFirst({
      where: { tenantId: context.tenantId, flagKey },
    });
    const globalFlag =
      tenantFlag ??
      (await this.prisma.featureFlag.findFirst({
        where: { tenantId: null, flagKey },
      }));

    return {
      tenantId: context.tenantId,
      flagKey,
      enabled: globalFlag?.enabled ?? false,
      source: globalFlag ? "prisma" : "default_false",
    };
  }

  private async createAgent(context: RequestContext, input: CreateAgentBody) {
    const agent = await this.prisma.agent.upsert({
      where: { id: input.agentId },
      create: {
        id: input.agentId,
        tenantId: context.tenantId,
        name: input.name,
        description: input.description,
        status: "draft",
        defaultLocale: input.defaultLocale,
        createdBy: context.actorId,
        metadata: metadataToPrismaJson(input.metadata),
      },
      update: {
        name: input.name,
        description: input.description,
        defaultLocale: input.defaultLocale,
        metadata: metadataToPrismaJson(input.metadata),
      },
    });

    return {
      tenantId: agent.tenantId,
      agentId: agent.id,
      name: agent.name,
      description: agent.description ?? undefined,
      defaultLocale: agent.defaultLocale,
      status: agent.status,
      metadata: persistedMetadata(agent.metadata),
      createdBy: agent.createdBy,
    };
  }

  private async createAgentVersion(
    context: RequestContext,
    agentId: string,
    input: CreateAgentVersionBody,
  ) {
    const existingVersions = await this.prisma.agentVersion.count({
      where: { tenantId: context.tenantId, agentId },
    });
    const versionNumber = existingVersions + 1;
    const agentVersionId = `${agentId}-v${versionNumber}`;
    const version = await this.prisma.agentVersion.create({
      data: {
        id: agentVersionId,
        tenantId: context.tenantId,
        agentId,
        versionNumber,
        status: "draft",
        promptVersionId: input.promptVersionId,
        flowVersionId: input.flowVersionId,
        knowledgeBaseVersionId: input.knowledgeBaseVersionId,
        capabilities: arrayToPrismaJson(input.capabilities),
        createdBy: context.actorId,
        metadata: metadataToPrismaJson(input.metadata),
      },
    });

    return {
      tenantId: version.tenantId,
      agentId: version.agentId,
      agentVersionId: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      promptVersionId: version.promptVersionId ?? undefined,
      flowVersionId: version.flowVersionId ?? undefined,
      knowledgeBaseVersionId: version.knowledgeBaseVersionId ?? undefined,
      capabilities: persistedJsonArray(version.capabilities),
      metadata: persistedMetadata(version.metadata),
      createdBy: version.createdBy,
    };
  }

  private async createCall(context: RequestContext, input: CreateVoiceCallBody) {
    const session = await this.prisma.callSession.upsert({
      where: { id: input.callId },
      create: {
        id: input.callId,
        tenantId: context.tenantId,
        direction: input.direction,
        status: "draft",
        correlationId: context.correlationId,
        metadata: metadataToPrismaJson(input.metadata),
      },
      update: {
        direction: input.direction,
        status: "draft",
        correlationId: context.correlationId,
        metadata: metadataToPrismaJson(input.metadata),
      },
    });

    return mapCallSession(session, "not_started");
  }

  private async registerCallEvent(
    context: RequestContext,
    callId: string,
    input: CreateVoiceCallEventBody,
  ) {
    const event = await this.prisma.callEvent.create({
      data: {
        id: `${callId}-event-${context.correlationId}-${Date.now()}`,
        tenantId: context.tenantId,
        callId,
        actorId: context.actorId,
        correlationId: context.correlationId,
        type: input.type,
        status: input.status,
        metadata: metadataToPrismaJson(input.metadata),
        occurredAt: context.occurredAt,
      },
    });

    return {
      tenantId: event.tenantId,
      callId: event.callId,
      type: event.type,
      status: event.status ?? undefined,
      correlationId: event.correlationId,
      metadata: persistedMetadata(event.metadata),
    };
  }

  private async getCall(context: RequestContext, callId: string) {
    const session = await this.prisma.callSession.findFirst({
      where: { tenantId: context.tenantId, id: callId },
    });
    return session ? mapCallSession(session) : undefined;
  }

  private async ingestMockProviderEvent(
    context: RequestContext,
    input: MockProviderEventBody,
    headers: Readonly<Record<string, unknown>>,
  ) {
    await this.assertMockProviderEventPolicy(context, input);
    const operationContext = createOperationContext({
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      occurredAt: context.occurredAt,
      source: context.source,
    });
    if (!operationContext.ok) {
      throw validationError(operationContext.error.message);
    }

    const result = await ingestProviderEvent({
      context: operationContext.value,
      source: input.source,
      type: input.type,
      eventId: input.eventId,
      providerCallRef: input.providerCallRef,
      occurredAt: new Date(input.occurredAt),
      headers,
      payload: {
        safeSummary: input.safeSummary,
        safeIntent: input.safeIntent,
        disposition: input.disposition,
        handoffRecommended: input.handoffRecommended,
        ...input.metadata,
      },
      metadata: input.metadata,
      normalizer: this.providerNormalizer,
      signatureVerifier: this.providerSignatureVerifier,
      replayProtection: this.providerReplayProtection,
      logger: this.observability.logger,
      metrics: this.observability.metrics,
      audit: {
        record: (event) => this.recordAuditEvent(event),
      },
    });
    if (!result.ok) {
      throwApiErrorForProviderEvent(result.error.message, result.error.code);
    }
    if (result.value.event) {
      await this.persistSanitizedProviderEvent(result.value.event);
    }

    return {
      eventId: result.value.eventId,
      status: result.value.status,
      replayDetected: result.value.replayDetected,
      normalizedType: result.value.normalizedType,
      processed: result.value.processed,
      safeSummary: result.value.safeSummary,
      auditRefs: result.value.auditRefs,
      metricsSnapshot: this.observability.metrics.snapshot(),
    };
  }

  private async assertMockProviderEventPolicy(
    context: RequestContext,
    input: MockProviderEventBody,
  ): Promise<void> {
    const operationContext = createOperationContext({
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      occurredAt: context.occurredAt,
      source: context.source,
    });
    if (!operationContext.ok) {
      throw validationError(operationContext.error.message);
    }
    const actorId = createActorId(context.actorId);
    if (!actorId.ok) {
      throw validationError(actorId.error.message);
    }
    const result = await evaluatePolicyGate({
      context: operationContext.value,
      actor: {
        actorId: actorId.value,
        tenantId: context.tenantId,
        roles: context.roles,
      },
      action: "provider.mock_event.ingest",
      metadata: {
        eventId: input.eventId,
        source: input.source,
        type: input.type,
      },
      logger: this.observability.logger,
      metrics: this.observability.metrics,
    });
    if (!result.allowed) {
      throw policyBlockedError("Mock provider event ingestion blocked.", {
        reasons: result.reasons,
      });
    }
  }

  private async persistSanitizedProviderEvent(event: SanitizedProviderEvent): Promise<void> {
    await this.prisma.providerCallEvent.create({
      data: {
        id: `provider-event-${event.eventId}`,
        tenantId: event.tenantId,
        callId: event.safeCallSessionRef,
        providerName: "mock",
        providerEventId: event.eventId,
        providerCallId: event.providerCallRef,
        status: event.normalizedStatus,
        metadata: toPrismaJson(event.metadata),
        occurredAt: new Date(),
      },
    });

    if (event.postCallAvailable) {
      await this.prisma.postCallResult.create({
        data: {
          id: `post-call-${event.eventId}`,
          tenantId: event.tenantId,
          callId: event.safeCallSessionRef,
          status: event.normalizedStatus === "failed" ? "failed" : "completed",
          redactedSummary: event.safeSummary,
          outcome: event.safeOutcome ?? event.normalizedStatus,
          handoffRecommended: event.handoffRecommended,
          metadata: toPrismaJson(event.metadata),
          occurredAt: new Date(),
        },
      });
    }
  }

  private async getCedcoConfiguration(context: RequestContext) {
    const configuration = await this.prisma.cedcoD02Configuration.findUnique({
      where: { tenantId: context.tenantId },
    });
    return configuration
      ? mapCedcoConfiguration(configuration)
      : defaultCedcoConfiguration(context);
  }

  private async updateCedcoConfiguration(context: RequestContext, input: CedcoConfigurationBody) {
    if (input.realCallsEnabled) {
      throw validationError("realCallsEnabled cannot be true in the Prisma-backed API loop.");
    }

    const configuration = await this.prisma.cedcoD02Configuration.upsert({
      where: { tenantId: context.tenantId },
      create: {
        id: `${context.tenantId}-d02-config`,
        tenantId: context.tenantId,
        defaultLocale: input.defaultLocale,
        activeAgentVersionId: input.activeAgentVersionId,
        activePromptVersionId: input.activePromptVersionId,
        activeFlowVersionId: input.activeFlowVersionId,
        activeKnowledgeBaseVersionId: input.activeKnowledgeBaseVersionId,
        allowedSiteIds: arrayToPrismaJson(input.allowedSiteIds),
        allowedServiceIds: arrayToPrismaJson(input.allowedServiceIds),
        handoffEnabled: input.handoffEnabled,
        schedulingMode: input.schedulingMode,
        eligibilityMode: input.eligibilityMode,
        realCallsEnabled: false,
        metadata: metadataToPrismaJson(input.metadata),
      },
      update: {
        defaultLocale: input.defaultLocale,
        activeAgentVersionId: input.activeAgentVersionId,
        activePromptVersionId: input.activePromptVersionId,
        activeFlowVersionId: input.activeFlowVersionId,
        activeKnowledgeBaseVersionId: input.activeKnowledgeBaseVersionId,
        allowedSiteIds: arrayToPrismaJson(input.allowedSiteIds),
        allowedServiceIds: arrayToPrismaJson(input.allowedServiceIds),
        handoffEnabled: input.handoffEnabled,
        schedulingMode: input.schedulingMode,
        eligibilityMode: input.eligibilityMode,
        realCallsEnabled: false,
        metadata: metadataToPrismaJson(input.metadata),
      },
    });

    return mapCedcoConfiguration(configuration);
  }

  private async classifyCedcoIntent(input: ClassifyCedcoIntentBody) {
    return {
      intent: classifyCedcoCallIntent({
        textRedacted: input.text,
        ...(input.hint ? { hintIntent: input.hint } : {}),
      }),
      classifier: "deterministic-domain-rules",
    };
  }

  private async evaluateCedcoReadiness(context: RequestContext, input: EvaluateCedcoReadinessBody) {
    const configuration = {
      ...input.configuration,
      tenantId: context.tenantId,
      realCallsEnabled: false as const,
      metadata: sanitizeMetadata(input.configuration.metadata),
    } as unknown as CedcoD02Configuration;
    const operationContext = createOperationContext({
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      occurredAt: context.occurredAt,
      source: context.source,
    });
    if (!operationContext.ok) {
      throw validationError(operationContext.error.message);
    }
    const result = await evaluateCedcoCallReadiness({
      context: operationContext.value,
      configuration,
      objective: (input.objective ?? "faq") as CedcoCallObjective,
      metadata: input.metadata,
    });
    if (!result.ok) {
      throw validationError(result.error.message);
    }
    return result.value;
  }

  private async evaluateCedcoCompliance(input: EvaluateCedcoComplianceBody) {
    const result = evaluateCedcoCompliance({
      textRedacted: input.text,
      ...(input.intent ? { intent: input.intent } : {}),
      metadata: input.metadata,
      optOut: input.intent === "opt_out",
    });
    if (!result.ok) {
      throw validationError("CEDCO compliance evaluation failed.");
    }
    return result.value;
  }

  private async evaluateCedcoHandoff(input: EvaluateCedcoHandoffBody) {
    const result = evaluateCedcoHandoff({
      intent: input.intent,
      ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
      policyRisk: input.reason === "policy_risk",
      integrationRequiredUnavailable: input.reason === "integration_required",
      outOfScope: input.reason === "out_of_scope",
    });
    if (!result.ok) {
      throw validationError("CEDCO handoff evaluation failed.");
    }
    return result.value;
  }

  private async createCedcoSchedulingRequest(
    context: RequestContext,
    input: CreateCedcoSchedulingRequestBody,
  ) {
    const request = await this.prisma.cedcoSchedulingRequest.create({
      data: {
        id: `sched-${context.correlationId}-${Date.now()}`,
        tenantId: context.tenantId,
        patientContextRef: input.patientContextRef,
        serviceId: input.serviceId,
        siteId: input.siteId,
        status: input.mode === "mock" ? "mock_confirmed" : "integration_required",
        mode: input.mode,
        metadata: metadataToPrismaJson(input.metadata),
      },
    });

    return {
      schedulingRequestId: request.id,
      tenantId: request.tenantId,
      patientContextRef: request.patientContextRef,
      serviceId: request.serviceId,
      siteId: request.siteId ?? undefined,
      mode: request.mode,
      status: request.status,
      metadata: persistedMetadata(request.metadata),
      realAppointmentCreated: false,
    };
  }

  private async createCedcoEligibilityCheck(
    context: RequestContext,
    input: CreateCedcoEligibilityCheckBody,
  ) {
    const check = await this.prisma.cedcoEligibilityCheck.create({
      data: {
        id: `elig-${context.correlationId}-${Date.now()}`,
        tenantId: context.tenantId,
        patientContextRef: input.patientContextRef,
        agreementId: input.agreementId,
        serviceId: input.serviceId,
        status: input.mode === "mock" ? "unknown" : "integration_required",
        mode: input.mode,
        metadata: metadataToPrismaJson(input.metadata),
      },
    });

    return {
      eligibilityCheckId: check.id,
      tenantId: check.tenantId,
      patientContextRef: check.patientContextRef,
      agreementId: check.agreementId ?? undefined,
      serviceId: check.serviceId ?? undefined,
      mode: check.mode,
      status: check.status,
      metadata: persistedMetadata(check.metadata),
      realEligibilityChecked: false,
    };
  }

  private async getCedcoMetricsSummary(context: RequestContext) {
    const metrics = await this.prisma.cedcoD02Metric.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { occurredAt: "asc" },
    });

    return {
      tenantId: context.tenantId,
      total: metrics.length,
      dimensions: {},
      source: metrics.length > 0 ? "prisma" : "empty-prisma-summary",
    };
  }

  private async runCedcoD02MockCallFlow(
    context: RequestContext,
    input: RunCedcoD02MockCallFlowBody,
  ) {
    const result = await runCedcoD02MockCallFlow({
      intent: {
        tenantId: context.tenantId,
        actorId: context.actorId,
        correlationId: context.correlationId,
        cedcoSiteId: input.cedcoSiteId,
        serviceId: input.serviceId,
        ...(input.agreementId ? { agreementId: input.agreementId } : {}),
        safeContactRef: input.safeContactRef,
        patientContextRef: input.patientContextRef,
        consentRef: input.consentRef,
        callPurpose: input.callPurpose,
        objective: input.objective,
        ...(input.scriptId ? { scriptId: input.scriptId } : {}),
        metadata: input.metadata,
      },
      runtime: new MockCallRuntimeAdapter(),
      logger: this.observability.logger,
      metrics: this.observability.metrics,
      audit: {
        record: (event) => this.recordAuditEvent(event),
      },
    });
    if (!result.ok) {
      throw validationError(result.error.message);
    }

    await this.persistMockCallFlow(context, result.value);

    return {
      flowId: result.value.flowId,
      sessionId: result.value.session.sessionId,
      status: result.value.status,
      providerCallRef: result.value.providerCallRef,
      eventsCount: result.value.events.length,
      safeSummary: result.value.safeSummary,
      disposition: result.value.disposition,
      handoffRecommended: result.value.handoffRecommended,
      auditRefs: result.value.auditRefs,
      metrics: result.value.metrics,
      metricsSnapshot: this.observability.metrics.snapshot(),
    };
  }

  private async persistMockCallFlow(
    context: RequestContext,
    flow: CedcoD02MockCallFlowResult,
  ): Promise<void> {
    await this.prisma.callSession.upsert({
      where: { id: flow.session.sessionId },
      create: {
        id: flow.session.sessionId,
        tenantId: context.tenantId,
        direction: "outbound",
        status: flow.session.status,
        correlationId: context.correlationId,
        metadata: toPrismaJson(
          sanitizeMetadata({
            runtimeMode: "mock",
            providerCallRef: flow.providerCallRef,
            flowId: flow.flowId,
          }),
        ),
        startedAt: flow.session.startedAt,
        endedAt: flow.session.completedAt,
      },
      update: {
        status: flow.session.status,
        metadata: toPrismaJson(
          sanitizeMetadata({
            runtimeMode: "mock",
            providerCallRef: flow.providerCallRef,
            flowId: flow.flowId,
          }),
        ),
        endedAt: flow.session.completedAt,
      },
    });

    for (const event of flow.events) {
      await this.prisma.callEvent.create({
        data: {
          id: event.eventId,
          tenantId: context.tenantId,
          callId: flow.session.sessionId,
          actorId: context.actorId,
          correlationId: context.correlationId,
          type: event.type,
          status: event.type === "call.mock.completed" ? "completed" : "running",
          metadata: toPrismaJson(event.payload),
          occurredAt: event.occurredAt,
        },
      });

      await this.prisma.providerCallEvent.create({
        data: {
          id: `provider-${event.eventId}`,
          tenantId: context.tenantId,
          callId: flow.session.sessionId,
          providerName: "mock",
          providerEventId: event.providerEventRef,
          providerCallId: flow.providerCallRef,
          status: event.type,
          metadata: toPrismaJson(event.payload),
          occurredAt: event.occurredAt,
        },
      });
    }

    await this.prisma.postCallResult.create({
      data: {
        id: `${flow.session.sessionId}-post-call`,
        tenantId: context.tenantId,
        callId: flow.session.sessionId,
        status: "completed",
        redactedSummary: flow.safeSummary,
        outcome: flow.disposition,
        handoffRecommended: flow.handoffRecommended,
        metadata: toPrismaJson(flow.metrics),
        occurredAt: flow.session.completedAt ?? context.occurredAt,
      },
    });

    await this.prisma.cedcoD02Metric.create({
      data: {
        id: `metric-${flow.flowId}`,
        tenantId: context.tenantId,
        key: "cedco_d02.mock_flow.completed",
        value: flow.events.length,
        dimensions: toPrismaJson(flow.metrics),
        occurredAt: flow.session.completedAt ?? context.occurredAt,
      },
    });
  }

  private async getOperationsDashboard(context: RequestContext) {
    const [sessions, providerEvents, audits, cedcoMetrics] = await Promise.all([
      this.prisma.callSession.findMany({
        where: { tenantId: context.tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.providerCallEvent.findMany({
        where: { tenantId: context.tenantId, providerName: "mock" },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId: context.tenantId },
        orderBy: { occurredAt: "desc" },
        take: 8,
      }),
      this.prisma.cedcoD02Metric.findMany({
        where: { tenantId: context.tenantId },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
    ]);

    const metricsSnapshot: DashboardMetric[] = [
      ...this.observability.metrics.snapshot().counters.map((counter) => ({
        metricName: counter.name,
        value: counter.value,
        labels: counter.labels,
      })),
      ...cedcoMetrics.map((metric) => ({
        metricName: metric.key,
        value: metric.value,
        labels: labelsFromJson(metric.dimensions),
      })),
    ];
    const auditPreview: DashboardAuditPreview[] = audits.map((audit) => ({
      auditId: audit.id,
      action: audit.action,
      severity: audit.result === "failure" ? "warn" : "info",
      occurredAt: audit.occurredAt.toISOString(),
      correlationId: audit.correlationId,
      metadata: persistedMetadata(audit.metadata),
    }));
    const mockCallFlows: DashboardMockCallFlow[] = sessions
      .filter((session) => session.metadata && JSON.stringify(session.metadata).includes("mock"))
      .map((session) => {
        const metadata = persistedMetadata(session.metadata);
        return {
          flowId: safeString(metadata.flowId) ?? `mock-flow-${session.correlationId}`,
          sessionId: session.id,
          providerCallRef: toMockCallRef(
            safeString(metadata.providerCallRef) ?? `mock_call_${session.correlationId}`,
          ),
          status: session.status,
          safeContactRef: "safe-contact-ref-redacted",
          callPurpose: "orientation",
          disposition: session.status === "completed" ? "resolved_mock" : "pending_mock",
          handoffRecommended: false,
          createdAt: (session.startedAt ?? session.createdAt).toISOString(),
          completedAt: session.endedAt?.toISOString(),
        };
      });
    const dashboardProviderEvents: DashboardProviderEvent[] = providerEvents.map((event) => ({
      eventId: event.providerEventId,
      providerCallRef: toMockCallRef(event.providerCallId ?? `mock_call_${event.providerEventId}`),
      source: "mock",
      type: toProviderMockType(event.status ?? "provider.mock.post_call.available"),
      status: event.status ?? "processed",
      replayBlocked: event.status === "replay_blocked",
      processed: event.status !== "replay_blocked",
      occurredAt: event.occurredAt.toISOString(),
    }));
    const failureAudits = audits.filter((audit) => audit.result === "failure");

    return buildOperationalDashboard({
      tenantId: context.tenantId,
      correlationId: context.correlationId,
      generatedAt: context.occurredAt,
      mockCallFlows,
      providerEvents: dashboardProviderEvents,
      evalSummary: buildCedcoD02EvalDashboardSummary(),
      policyGateSummary: {
        deniedTotal: failureAudits.length,
        topDeniedReasons: failureAudits.map((audit) => audit.action).slice(0, 5),
      },
      auditPreview,
      metricsSnapshot,
    });
  }
}

function defaultCedcoConfiguration(context: RequestContext) {
  return {
    tenantId: context.tenantId,
    defaultLocale: "es-CO",
    allowedSiteIds: ["bucaramanga", "piedecuesta", "barrancabermeja"],
    allowedServiceIds: [],
    handoffEnabled: true,
    schedulingMode: "mock",
    eligibilityMode: "mock",
    realCallsEnabled: false,
    metadata: {},
  };
}

function toDialerDispatchRequest(
  context: RequestContext,
  input: InternalDialerDryRunBody | CedcoD02InternalDialerDryRunRequest,
): DialerDispatchRequest {
  return {
    idempotencyKey: input.idempotency_key ?? "",
    externalRequestId: input.external_request_id ?? input.idempotency_key ?? "",
    tenantId: context.tenantId,
    mode: input.mode,
    runtimeMode: input.runtimeMode,
    safeContactRef: input.safe_contact_ref,
    agentAlias: input.agent_alias,
    callerAlias: input.caller_alias,
    dynamicVars: sanitizeMetadata(input.dynamic_vars),
    consent: { granted: input.consent.granted, consentRef: input.consent_ref },
    callback: {
      ...(input.callback_alias ? { callbackAlias: input.callback_alias } : {}),
      internalEventTopic: input.internal_event_topic ?? "internal.events.dialer.dry_run",
    },
    metadata: sanitizeMetadata({
      ...input.metadata,
      source: "api_internal_dialer_dry_run",
    }),
  };
}

function toCedcoD02DialerDryRunIntent(
  context: RequestContext,
  input: RunCedcoD02DialerDryRunBody,
): CedcoD02DialerDryRunInput {
  return {
    tenantId: context.tenantId,
    actorId: context.actorId,
    correlationId: context.correlationId,
    ...(input.idempotency_key ? { idempotencyKey: input.idempotency_key } : {}),
    ...(input.external_request_id ? { externalRequestId: input.external_request_id } : {}),
    safeContactRef: input.safe_contact_ref,
    ...(input.patient_context_ref ? { patientContextRef: input.patient_context_ref } : {}),
    ...(input.cedco_site_id ? { cedcoSiteId: input.cedco_site_id } : {}),
    ...(input.service_id ? { serviceId: input.service_id } : {}),
    ...(input.agreement_id ? { agreementId: input.agreement_id } : {}),
    ...(input.call_purpose ? { callPurpose: input.call_purpose } : {}),
    ...(input.objective ? { objective: input.objective } : {}),
    consent: { granted: input.consent.granted },
    consentRef: input.consent_ref,
    ...(input.metadata ? { metadata: input.metadata } : {}),
    ...(input.dynamic_vars ? { dynamicVars: input.dynamic_vars } : {}),
  };
}

function toCedcoD02DialerDryRunResponse(
  value: CedcoD02DialerDryRunResult,
  metrics: MetricsRegistryPort,
) {
  return {
    flowId: value.flowId,
    status: value.status,
    idempotency_key_ref: value.idempotencyKeyRef,
    internal_call_id: value.internalCallId,
    safe_contact_ref: value.safeContactRef,
    blocked_reasons: value.blockedReasons,
    provider_egress: value.providerEgress,
    would_call_provider: value.wouldCallProvider,
    auditRefs: value.auditRefs,
    metadata: value.metadata,
    metricsSnapshot: metrics.snapshot(),
  };
}

function mapCedcoConfiguration(row: {
  readonly tenantId: string;
  readonly defaultLocale: string;
  readonly activeAgentVersionId: string | null;
  readonly activePromptVersionId: string | null;
  readonly activeFlowVersionId: string | null;
  readonly activeKnowledgeBaseVersionId: string | null;
  readonly allowedSiteIds: unknown;
  readonly allowedServiceIds: unknown;
  readonly handoffEnabled: boolean;
  readonly schedulingMode: string;
  readonly eligibilityMode: string;
  readonly realCallsEnabled: boolean;
  readonly metadata: unknown;
}) {
  return {
    tenantId: row.tenantId,
    defaultLocale: row.defaultLocale,
    activeAgentVersionId: row.activeAgentVersionId ?? undefined,
    activePromptVersionId: row.activePromptVersionId ?? undefined,
    activeFlowVersionId: row.activeFlowVersionId ?? undefined,
    activeKnowledgeBaseVersionId: row.activeKnowledgeBaseVersionId ?? undefined,
    allowedSiteIds: persistedJsonArray(row.allowedSiteIds),
    allowedServiceIds: persistedJsonArray(row.allowedServiceIds),
    handoffEnabled: row.handoffEnabled,
    schedulingMode: row.schedulingMode,
    eligibilityMode: row.eligibilityMode,
    realCallsEnabled: row.realCallsEnabled,
    metadata: persistedMetadata(row.metadata),
  };
}

function mapCallSession(
  row: {
    readonly id: string;
    readonly tenantId: string;
    readonly direction: string;
    readonly status: string;
    readonly correlationId: string;
    readonly metadata: unknown;
  },
  dispatch?: "not_started",
) {
  return {
    tenantId: row.tenantId,
    callId: row.id,
    direction: row.direction,
    status: row.status,
    correlationId: row.correlationId,
    metadata: persistedMetadata(row.metadata),
    ...(dispatch ? { dispatch } : {}),
  };
}

function labelsFromJson(value: unknown): Readonly<Record<string, string>> {
  const metadata = persistedMetadata(value);
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, item]) => typeof item === "string")
      .map(([key, item]) => [key, String(item)]),
  );
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function toMockCallRef(value: string): `mock_call_${string}` {
  return value.startsWith("mock_call_") ? (value as `mock_call_${string}`) : `mock_call_${value}`;
}

function toProviderMockType(value: string): `provider.mock.${string}` {
  return value.startsWith("provider.mock.")
    ? (value as `provider.mock.${string}`)
    : "provider.mock.post_call.available";
}

function throwApiErrorForProviderEvent(message: string, code: string): never {
  if (code === "conflict") {
    throw conflictError(message);
  }
  if (message.toLowerCase().includes("signature")) {
    throw policyBlockedError(message);
  }
  throw validationError(message);
}
