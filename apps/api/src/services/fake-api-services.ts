import { createOperationContext, sanitizeMetadata } from "../../../../packages/shared/src/core";
import { classifyCedcoCallIntent } from "../../../../modules/products/cedco/d02-calls/src/use-cases/classify-cedco-call-intent";
import { evaluateCedcoCallReadiness } from "../../../../modules/products/cedco/d02-calls/src/use-cases/evaluate-cedco-call-readiness";
import { evaluateCedcoCompliance } from "../../../../modules/products/cedco/d02-calls/src/use-cases/evaluate-cedco-compliance";
import { evaluateCedcoHandoff } from "../../../../modules/products/cedco/d02-calls/src/use-cases/evaluate-cedco-handoff";
import { runCedcoD02MockCallFlow } from "../../../../modules/products/cedco/d02-calls/src/application/mock-runtime";
import { MockCallRuntimeAdapter } from "../../../../modules/voice/call-runtime/src";
import type { CedcoCallObjective } from "../../../../modules/products/cedco/d02-calls/src/cedco-call-objective";
import type { CedcoD02Configuration } from "../../../../modules/products/cedco/d02-calls/src/cedco-d02-configuration";
import { validationError } from "../http/api-error";
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
  CreateVoiceCallBody,
  CreateVoiceCallEventBody,
  EvaluateCedcoComplianceBody,
  EvaluateCedcoHandoffBody,
  EvaluateCedcoReadinessBody,
  RunCedcoD02MockCallFlowBody,
} from "../contracts";
import type { ApiServices } from "./api-services";
import type { ApiAuditRecord } from "./api-services";

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

export function createFakeApiServices(): ApiServices {
  const agents = new Map<string, unknown>();
  const agentVersions = new Map<string, unknown[]>();
  const calls = new Map<string, StoredCall>();
  const configurations = new Map<string, CedcoConfigurationBody & { tenantId: string }>();
  const logger = new InMemoryLogger();
  const metrics = new InMemoryMetricsRegistry();
  const mockRuntime = new MockCallRuntimeAdapter();
  const auditEvents: ApiAuditRecord[] = [];
  const rateLimitStore = new InMemoryRateLimitStore();
  let testRateLimitRule: RateLimitRule | undefined;

  return {
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
  };
}
