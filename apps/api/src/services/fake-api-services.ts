import { createOperationContext, sanitizeMetadata } from "../../../../packages/shared/src/core";
import { randomBytes } from "node:crypto";
import { R02OperationalWorkspace } from "../../../../modules/products/cedco/r02-operations/src";
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
import { runCedcoD02MockCallFlow } from "../../../../modules/products/cedco/d02-calls/src/application/mock-runtime";
import { buildCedcoD02DashboardSummary } from "../../../../modules/products/cedco/d02-calls/src/application/dashboard";
import { MockCallRuntimeAdapter } from "../../../../modules/voice/call-runtime/src";
import {
  ingestProviderEvent,
  InMemoryReplayProtectionStore,
  MockProviderEventNormalizer,
  MockProviderSignatureVerifier,
} from "../../../../modules/voice/provider-events/src";
import { evaluatePolicyGate } from "../../../../modules/core/policy-gates/src";
import {
  BlockedInternalDialerAdapter,
  buildDialerReadinessReport,
  defaultDialerHardeningStatus,
  toInternalDialerDryRunResponse,
  type DialerDispatchRequest,
} from "../../../../modules/integrations/provider-adapters/internal-dialer/src";
import { createActorId } from "../../../../modules/core/identity-access/src";
import type { CedcoCallObjective } from "../../../../modules/products/cedco/d02-calls/src/cedco-call-objective";
import type { CedcoD02Configuration } from "../../../../modules/products/cedco/d02-calls/src/cedco-d02-configuration";
import { conflictError, policyBlockedError, validationError } from "../http/api-error";
import type { RequestContext } from "../http/request-context";
import {
  InMemoryLogger,
  InMemoryMetricsRegistry,
  sanitizeLogMetadata,
} from "../../../../packages/observability/src";
import {
  createRateLimitRule,
  defaultApiRateLimitRule,
  InMemoryRateLimitStore,
  type RateLimitRule,
} from "../../../../modules/core/rate-limits/src";
import { defaultRuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";
import type {
  CedcoConfigurationBody,
  ClassifyCedcoIntentBody,
  CreateAgentBody,
  CreateAgentVersionBody,
  CreateCedcoEligibilityCheckBody,
  CreateCedcoSchedulingRequestBody,
  AvailabilityQuery,
  CreateAgentBodyR02,
  CreateAgentVersionBodyR02,
  CreateAppointmentBody,
  CreateAvailabilityBody,
  CreateKnowledgeBaseBody,
  CreateVoiceCallBody,
  CreateVoiceCallEventBody,
  EvaluateCedcoComplianceBody,
  EvaluateCedcoHandoffBody,
  EvaluateCedcoReadinessBody,
  MockProviderEventBody,
  RescheduleAppointmentBody,
  RunCedcoD02DialerDryRunBody,
  RunCedcoD02MockCallFlowBody,
  SearchKnowledgeBody,
  SimulateAgentFlowBody,
  InternalDialerDryRunBody,
  UploadKnowledgeDocumentBody,
  UpsertHandoffTargetBody,
} from "../contracts";
import type { ApiServices } from "./api-services";
import type { ApiAuditRecord } from "./api-services";

export interface FakeApiServicesInput {
  readonly dialerDryRun?: CedcoD02InternalDialerDryRunPort;
}

interface StoredCall {
  readonly callId: string;
  readonly tenantId: string;
  readonly direction: "outbound" | "inbound";
  readonly status: "draft";
  readonly correlationId: string;
  readonly metadata: unknown;
}

function toOperationContext(context: RequestContext) {
  const result = createOperationContext({
    tenantId: context.tenantId,
    actorId: context.actorId,
    correlationId: context.correlationId,
    occurredAt: context.occurredAt,
    source: context.source,
  });
  if (!result.ok) {
    throw validationError(result.error.message);
  }
  return result.value;
}

function defaultCedcoConfiguration(
  tenantId: string,
): CedcoConfigurationBody & { tenantId: string } {
  return {
    tenantId,
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

export function createFakeApiServices(options: FakeApiServicesInput = {}): ApiServices {
  const agents = new Map<string, unknown>();
  const agentVersions = new Map<string, unknown[]>();
  const calls = new Map<string, StoredCall>();
  const configurations = new Map<string, CedcoConfigurationBody & { tenantId: string }>();
  const logger = new InMemoryLogger();
  const metrics = new InMemoryMetricsRegistry();
  const mockRuntime = new MockCallRuntimeAdapter();
  const providerReplayProtection = new InMemoryReplayProtectionStore();
  const providerNormalizer = new MockProviderEventNormalizer();
  const providerSignatureVerifier = new MockProviderSignatureVerifier();
  const internalDialerAdapter = new BlockedInternalDialerAdapter({
    hardeningStatus: defaultDialerHardeningStatus,
    logger,
    metrics,
  });
  const auditEvents: ApiAuditRecord[] = [];
  const rateLimitStore = new InMemoryRateLimitStore();
  const r02Workspace = new R02OperationalWorkspace();
  const fakeAuthSessions = new Map<
    string,
    {
      readonly tenantId: string;
      readonly actorId: string;
      readonly loginRef: string;
      readonly roles: string[];
      readonly expiresAt: Date;
      readonly resetRequired: boolean;
    }
  >();
  let testRateLimitRule: RateLimitRule | undefined;

  return {
    auth: {
      async login(input) {
        if (input.credential.trim().length < 8) {
          throw validationError("synthetic credential is invalid");
        }
        const roles = rolesForSyntheticLogin(input.loginRef);
        const sessionToken = `synthetic-session-${randomBytes(12).toString("hex")}`;
        const principal = {
          tenantId: input.tenantId,
          actorId: input.loginRef.replace(/[^a-z0-9-]/giu, "-").toLowerCase(),
          loginRef: input.loginRef,
          roles,
          resetRequired: false,
          sessionId: `synthetic-${randomBytes(6).toString("hex")}`,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        };
        fakeAuthSessions.set(sessionToken, principal);
        return { sessionToken, principal };
      },
      async resolveSession(sessionToken, tenantId) {
        const principal = fakeAuthSessions.get(sessionToken);
        if (!principal || (tenantId && principal.tenantId !== tenantId)) {
          return undefined;
        }
        return principal;
      },
      async logout(sessionToken) {
        return { revoked: fakeAuthSessions.delete(sessionToken) };
      },
    },
    observability: {
      logger,
      metrics,
      recordAuditEvent: async (event) => {
        auditEvents.push({
          ...event,
          metadata: sanitizeLogMetadata(event.metadata),
        });
      },
      getAuditEvents: () => [...auditEvents],
      getLogEntries: () => logger.getEntries(),
    },
    security: {
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
    },
    core: {
      async getFeatureFlag(context, flagKey) {
        return {
          tenantId: context.tenantId,
          flagKey,
          enabled: false,
          source: "fake-api-services",
        };
      },
    },
    agentPlatform: {
      async createAgent(context, input: CreateAgentBody) {
        const agent = {
          tenantId: context.tenantId,
          agentId: input.agentId,
          name: input.name,
          ...(input.description ? { description: input.description } : {}),
          defaultLocale: input.defaultLocale,
          status: "draft",
          metadata: sanitizeMetadata(input.metadata),
          createdBy: context.actorId,
        };
        agents.set(`${context.tenantId}:${input.agentId}`, agent);
        return agent;
      },
      async createAgentVersion(context, agentId, input: CreateAgentVersionBody) {
        const key = `${context.tenantId}:${agentId}`;
        const versions = agentVersions.get(key) ?? [];
        const version = {
          tenantId: context.tenantId,
          agentId,
          agentVersionId: `${agentId}-v${versions.length + 1}`,
          versionNumber: versions.length + 1,
          status: "draft",
          capabilities: input.capabilities,
          ...(input.promptVersionId ? { promptVersionId: input.promptVersionId } : {}),
          ...(input.flowVersionId ? { flowVersionId: input.flowVersionId } : {}),
          ...(input.knowledgeBaseVersionId
            ? { knowledgeBaseVersionId: input.knowledgeBaseVersionId }
            : {}),
          metadata: sanitizeMetadata(input.metadata),
          createdBy: context.actorId,
        };
        versions.push(version);
        agentVersions.set(key, versions);
        return version;
      },
    },
    voice: {
      async createCall(context, input: CreateVoiceCallBody) {
        const call: StoredCall = {
          tenantId: context.tenantId,
          callId: input.callId,
          direction: input.direction,
          status: "draft",
          correlationId: context.correlationId,
          metadata: sanitizeMetadata(input.metadata),
        };
        calls.set(`${context.tenantId}:${input.callId}`, call);
        return {
          ...call,
          dispatch: "not_started",
        };
      },
      async registerCallEvent(context, callId, input: CreateVoiceCallEventBody) {
        return {
          tenantId: context.tenantId,
          callId,
          type: input.type,
          ...(input.status ? { status: input.status } : {}),
          correlationId: context.correlationId,
          metadata: sanitizeMetadata(input.metadata),
        };
      },
      async getCall(context, callId) {
        return calls.get(`${context.tenantId}:${callId}`);
      },
      async ingestMockProviderEvent(context, input, headers) {
        await assertMockProviderEventPolicy(context, input, logger, metrics);
        const operationContext = toOperationContext(context);
        const payload = {
          safeSummary: input.safeSummary,
          safeIntent: input.safeIntent,
          disposition: input.disposition,
          handoffRecommended: input.handoffRecommended,
          ...input.metadata,
        };
        const result = await ingestProviderEvent({
          context: operationContext,
          source: input.source,
          type: input.type,
          eventId: input.eventId,
          providerCallRef: input.providerCallRef,
          occurredAt: new Date(input.occurredAt),
          headers,
          payload,
          metadata: input.metadata,
          normalizer: providerNormalizer,
          signatureVerifier: providerSignatureVerifier,
          replayProtection: providerReplayProtection,
          logger,
          metrics,
          audit: {
            record: async (event) => {
              auditEvents.push({
                ...event,
                metadata: sanitizeLogMetadata(event.metadata),
              });
            },
          },
        });
        if (!result.ok) {
          throwApiErrorForProviderEvent(result.error.message, result.error.code);
        }
        return {
          eventId: result.value.eventId,
          status: result.value.status,
          replayDetected: result.value.replayDetected,
          normalizedType: result.value.normalizedType,
          processed: result.value.processed,
          safeSummary: result.value.safeSummary,
          auditRefs: result.value.auditRefs,
          metricsSnapshot: metrics.snapshot(),
        };
      },
    },
    cedcoD02: {
      async getConfiguration(context) {
        return configurations.get(context.tenantId) ?? defaultCedcoConfiguration(context.tenantId);
      },
      async updateConfiguration(context, input: CedcoConfigurationBody) {
        if (input.realCallsEnabled) {
          throw validationError("realCallsEnabled cannot be true in the API skeleton loop.");
        }
        const configuration = {
          ...input,
          tenantId: context.tenantId,
          realCallsEnabled: false as const,
          metadata: sanitizeMetadata(input.metadata),
        };
        configurations.set(context.tenantId, configuration);
        return configuration;
      },
      async classifyIntent(_context, input: ClassifyCedcoIntentBody) {
        return {
          intent: classifyCedcoCallIntent({
            textRedacted: input.text,
            ...(input.hint ? { hintIntent: input.hint } : {}),
          }),
          classifier: "deterministic-domain-rules",
        };
      },
      async evaluateReadiness(context, input: EvaluateCedcoReadinessBody) {
        const operationContext = toOperationContext(context);
        const configuration = {
          ...input.configuration,
          tenantId: context.tenantId,
          realCallsEnabled: false as const,
          metadata: sanitizeMetadata(input.configuration.metadata),
        };
        const result = await evaluateCedcoCallReadiness({
          context: operationContext,
          configuration: configuration as unknown as CedcoD02Configuration,
          objective: (input.objective ?? "faq") as CedcoCallObjective,
          metadata: input.metadata,
        });
        if (!result.ok) {
          throw validationError(result.error.message);
        }
        return result.value;
      },
      async evaluateCompliance(_context, input: EvaluateCedcoComplianceBody) {
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
      },
      async evaluateHandoff(_context, input: EvaluateCedcoHandoffBody) {
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
      },
      async createSchedulingRequest(context, input: CreateCedcoSchedulingRequestBody) {
        return {
          schedulingRequestId: `sched-${context.correlationId}`,
          tenantId: context.tenantId,
          patientContextRef: input.patientContextRef,
          serviceId: input.serviceId,
          ...(input.siteId ? { siteId: input.siteId } : {}),
          mode: input.mode,
          status: input.mode === "mock" ? "mock_confirmed" : "integration_required",
          metadata: sanitizeMetadata(input.metadata),
          realAppointmentCreated: false,
        };
      },
      async createEligibilityCheck(context, input: CreateCedcoEligibilityCheckBody) {
        return {
          eligibilityCheckId: `elig-${context.correlationId}`,
          tenantId: context.tenantId,
          patientContextRef: input.patientContextRef,
          ...(input.agreementId ? { agreementId: input.agreementId } : {}),
          ...(input.serviceId ? { serviceId: input.serviceId } : {}),
          mode: input.mode,
          status: input.mode === "mock" ? "unknown" : "integration_required",
          metadata: sanitizeMetadata(input.metadata),
          realEligibilityChecked: false,
        };
      },
      async getMetricsSummary(context) {
        return {
          tenantId: context.tenantId,
          total: 0,
          dimensions: {},
          source: "empty-fake-summary",
        };
      },
      async runDialerDryRun(context, input: RunCedcoD02DialerDryRunBody) {
        const operationContext = toOperationContext(context);
        const result = await runCedcoD02InternalDialerDryRun({
          intent: toCedcoD02DialerDryRunIntent(context, input),
          logger,
          metrics,
          audit: {
            record: async (event) => {
              auditEvents.push({
                ...event,
                metadata: sanitizeLogMetadata(event.metadata),
              });
            },
          },
          dialer: {
            dryRun: async (request) =>
              options.dialerDryRun
                ? options.dialerDryRun.dryRun(request)
                : toInternalDialerDryRunResponse(
                    await internalDialerAdapter.dryRun(
                      toDialerDispatchRequest(context, request),
                      operationContext,
                    ),
                  ),
          },
        });
        if (!result.ok) {
          throw validationError(result.error.message);
        }

        return toCedcoD02DialerDryRunResponse(result.value, metrics);
      },
      async runMockCallFlow(context, input: RunCedcoD02MockCallFlowBody) {
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
          runtime: mockRuntime,
          logger,
          metrics,
          audit: {
            record: async (event) => {
              auditEvents.push({
                ...event,
                metadata: sanitizeLogMetadata(event.metadata),
              });
            },
          },
        });
        if (!result.ok) {
          throw validationError(result.error.message);
        }

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
          metricsSnapshot: metrics.snapshot(),
        };
      },
    },
    cedcoR02: {
      async seedDemo(context) {
        const operationContext = toOperationContext(context);
        r02Workspace.seedDemo(operationContext);
        return {
          tenantId: context.tenantId,
          seeded: true,
          externalProvidersUsed: false,
          transcriptAudioAccessed: false,
        };
      },
      async listAvailability(context, input: AvailabilityQuery) {
        return r02Workspace.queryAvailability({
          tenantId: context.tenantId,
          ...(input.siteId ? { siteId: input.siteId } : {}),
          ...(input.serviceTypeId ? { serviceTypeId: input.serviceTypeId } : {}),
          ...(input.from ? { from: new Date(input.from) } : {}),
          ...(input.to ? { to: new Date(input.to) } : {}),
        });
      },
      async createAvailability(context, input: CreateAvailabilityBody) {
        const result = r02Workspace.createAvailability({
          context: toOperationContext(context),
          slotId: input.slotId,
          resourceId: input.resourceId,
          siteId: input.siteId,
          serviceTypeId: input.serviceTypeId,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          capacity: input.capacity,
          metadata: input.metadata,
        });
        return unwrapDomainResult(result);
      },
      async listAppointments(context) {
        return r02Workspace.listAppointments(context.tenantId);
      },
      async createAppointment(context, input: CreateAppointmentBody) {
        const result = r02Workspace.createAppointment({
          context: toOperationContext(context),
          appointmentId: input.appointmentId,
          slotId: input.slotId,
          patientRef: input.patientRef,
          metadata: input.metadata,
        });
        return unwrapDomainResult(result);
      },
      async cancelAppointment(context, appointmentId) {
        const result = r02Workspace.cancelAppointment({
          context: toOperationContext(context),
          appointmentId,
        });
        return unwrapDomainResult(result);
      },
      async rescheduleAppointment(context, appointmentId, input: RescheduleAppointmentBody) {
        const result = r02Workspace.rescheduleAppointment({
          context: toOperationContext(context),
          appointmentId,
          newSlotId: input.newSlotId,
        });
        return unwrapDomainResult(result);
      },
      async runCalendarSyncTest(context, appointmentId) {
        const result = await r02Workspace.syncAppointmentTest({
          context: toOperationContext(context),
          appointmentId,
        });
        return unwrapDomainResult(result);
      },
      async createKnowledgeBase(context, input: CreateKnowledgeBaseBody) {
        const result = r02Workspace.createKnowledgeBase(toOperationContext(context), input);
        return unwrapDomainResult(result);
      },
      async listKnowledgeBases(context) {
        return [
          {
            knowledgeBaseId: `${context.tenantId}-kb-r02-default`,
            tenantId: context.tenantId,
            name: "CEDCO R02 Default Knowledge",
            status: "draft",
            metadata: { externalEmbeddingsUsed: false },
          },
        ];
      },
      async uploadKnowledgeDocument(context, input: UploadKnowledgeDocumentBody) {
        const result = r02Workspace.uploadKnowledgeDocument({
          context: toOperationContext(context),
          documentId: input.documentId,
          sourceName: input.sourceName,
          contentText: input.contentText,
          sizeBytes: Buffer.byteLength(input.contentText, "utf8"),
          metadata: input.metadata,
        });
        return unwrapDomainResult(result);
      },
      async listKnowledgeDocuments(context) {
        return r02Workspace.listKnowledgeDocuments(context.tenantId);
      },
      async processKnowledgeDocument(context, documentId) {
        const result = r02Workspace.processKnowledgeDocument(
          toOperationContext(context),
          documentId,
        );
        return unwrapDomainResult(result);
      },
      async approveKnowledgeDocument(context, documentId) {
        const result = r02Workspace.approveKnowledgeDocument(
          toOperationContext(context),
          documentId,
        );
        return unwrapDomainResult(result);
      },
      async activateKnowledgeDocument(context, documentId) {
        const result = r02Workspace.activateKnowledgeDocument(
          toOperationContext(context),
          documentId,
        );
        return unwrapDomainResult(result);
      },
      async searchKnowledge(context, input: SearchKnowledgeBody) {
        return r02Workspace.searchKnowledge({
          tenantId: context.tenantId,
          query: input.queryText,
          limit: input.limit,
        });
      },
      async createAgent(context, _input: CreateAgentBodyR02) {
        const result = r02Workspace.createAgent(toOperationContext(context));
        return unwrapDomainResult(result);
      },
      async listAgents(context) {
        return r02Workspace.listAgents(context.tenantId);
      },
      async createAgentVersion(context, agentId, input: CreateAgentVersionBodyR02) {
        const result = r02Workspace.createAgentVersion({
          context: toOperationContext(context),
          agentId,
          versionId: input.versionId,
          greeting: input.greeting,
          prompt: input.prompt,
          ...(input.allowedTools ? { allowedTools: input.allowedTools } : {}),
        });
        return unwrapDomainResult(result);
      },
      async approveAgent(context, agentId) {
        const result = r02Workspace.approveAgentVersion(toOperationContext(context), agentId);
        return unwrapDomainResult(result);
      },
      async activateAgent(context, agentId) {
        const result = r02Workspace.activateAgentVersion(toOperationContext(context), agentId);
        return unwrapDomainResult(result);
      },
      async simulateAgentFlow(context, input: SimulateAgentFlowBody) {
        const result = r02Workspace.simulateAgentFlow({
          context: toOperationContext(context),
          simulationId: input.simulationId,
          intent: input.intent,
          queryText: input.queryText,
          ...(input.slotId ? { slotId: input.slotId } : {}),
          ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
          ...(input.patientRef ? { patientRef: input.patientRef } : {}),
        });
        return unwrapDomainResult(result);
      },
      async listHandoffTargets(context) {
        return r02Workspace.listHandoffTargets(context.tenantId);
      },
      async upsertHandoffTarget(context, input: UpsertHandoffTargetBody) {
        const target = r02Workspace.upsertHandoffTarget({
          targetId: input.targetId,
          tenantId: context.tenantId,
          targetType: input.targetType,
          displayName: input.displayName,
          routeRef: input.routeRef,
          status: input.status,
          metadata: input.metadata ?? {},
        });
        return { ...target, realProviderMutation: false };
      },
      async listAudit(context) {
        return r02Workspace.listAudit(context.tenantId);
      },
    },
    operationsDashboard: {
      async getDashboard(context) {
        return buildFakeDashboard(context, auditEvents, metrics);
      },
      async getMockCallFlows(context) {
        return buildFakeDashboard(context, auditEvents, metrics).mockCallFlows;
      },
      async getProviderEvents(context) {
        return buildFakeDashboard(context, auditEvents, metrics).providerEvents;
      },
      async getEvalSummary(context) {
        return buildFakeDashboard(context, auditEvents, metrics).evalSummary;
      },
    },
    internalDialer: {
      async getReadiness(_context) {
        return buildDialerReadinessReport(defaultDialerHardeningStatus);
      },
      async dryRun(context, input) {
        const operationContext = toOperationContext(context);
        const result = await internalDialerAdapter.dryRun(
          toDialerDispatchRequest(context, input),
          operationContext,
        );
        return toInternalDialerDryRunResponse(result);
      },
    },
  };
}

function buildFakeDashboard(
  context: RequestContext,
  auditEvents: readonly ApiAuditRecord[],
  metrics: InMemoryMetricsRegistry,
) {
  return buildCedcoD02DashboardSummary({
    tenantId: context.tenantId,
    correlationId: context.correlationId,
    generatedAt: context.occurredAt,
    auditPreview: auditEvents.slice(-8).map((event, index) => ({
      auditId: `audit-preview-${index + 1}`,
      action: event.action,
      severity: event.result === "failure" ? "warn" : "info",
      occurredAt: event.occurredAt.toISOString(),
      correlationId: event.correlationId,
      metadata: sanitizeMetadata(event.metadata),
    })),
    metricsSnapshot: [
      ...metrics.snapshot().counters.map((counter) => ({
        metricName: counter.name,
        value: counter.value,
        labels: counter.labels,
      })),
      ...metrics.snapshot().observations.map((observation) => ({
        metricName: observation.name,
        value: observation.count,
        labels: observation.labels,
      })),
    ],
  });
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
  metrics: InMemoryMetricsRegistry,
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

async function assertMockProviderEventPolicy(
  context: RequestContext,
  input: MockProviderEventBody,
  logger: InMemoryLogger,
  metrics: InMemoryMetricsRegistry,
): Promise<void> {
  const operationContext = toOperationContext(context);
  const actorId = createActorId(context.actorId);
  if (!actorId.ok) {
    throw validationError(actorId.error.message);
  }
  const result = await evaluatePolicyGate({
    context: operationContext,
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
    logger,
    metrics,
  });
  if (!result.allowed) {
    throw policyBlockedError("Mock provider event ingestion blocked.", {
      reasons: result.reasons,
    });
  }
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

function rolesForSyntheticLogin(loginRef: string): string[] {
  const normalized = loginRef.toLowerCase();
  if (normalized.includes("viewer")) return ["reports_viewer"];
  if (normalized.includes("operator")) return ["r02_operator"];
  if (normalized.includes("compliance")) return ["compliance_auditor"];
  if (normalized.includes("handoff")) return ["human_handoff_agent"];
  if (normalized.includes("integration")) return ["integration_admin"];
  return ["cedco_admin"];
}

function unwrapDomainResult<T>(
  result:
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } },
): T {
  if (result.ok) return result.value;
  if (result.error.code === "conflict") throw conflictError(result.error.message);
  if (result.error.code === "forbidden") throw policyBlockedError(result.error.message);
  throw validationError(result.error.message);
}
