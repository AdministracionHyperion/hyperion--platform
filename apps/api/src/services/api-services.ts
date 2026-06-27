import type { RequestContext } from "../http/request-context";
import type {
  LoggerPort,
  MetricsRegistryPort,
  NormalizedStructuredLogEntry,
} from "../../../../packages/observability/src";
import type { RateLimitRule, RateLimitStorePort } from "../../../../modules/core/rate-limits/src";
import type { RuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";
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
  RunCedcoD02MockCallFlowBody,
} from "../contracts";

export interface ApiServices {
  readonly observability?: ApiObservabilityServices;
  readonly security?: ApiSecurityServices;
  readonly core: {
    getFeatureFlag(context: RequestContext, flagKey: string): Promise<unknown>;
  };
  readonly agentPlatform: {
    createAgent(context: RequestContext, input: CreateAgentBody): Promise<unknown>;
    createAgentVersion(
      context: RequestContext,
      agentId: string,
      input: CreateAgentVersionBody,
    ): Promise<unknown>;
  };
  readonly voice: {
    createCall(context: RequestContext, input: CreateVoiceCallBody): Promise<unknown>;
    registerCallEvent(
      context: RequestContext,
      callId: string,
      input: CreateVoiceCallEventBody,
    ): Promise<unknown>;
    getCall(context: RequestContext, callId: string): Promise<unknown | undefined>;
    ingestMockProviderEvent(
      context: RequestContext,
      input: MockProviderEventBody,
      headers: Readonly<Record<string, unknown>>,
    ): Promise<unknown>;
  };
  readonly cedcoD02: {
    getConfiguration(context: RequestContext): Promise<unknown>;
    updateConfiguration(context: RequestContext, input: CedcoConfigurationBody): Promise<unknown>;
    classifyIntent(context: RequestContext, input: ClassifyCedcoIntentBody): Promise<unknown>;
    evaluateReadiness(context: RequestContext, input: EvaluateCedcoReadinessBody): Promise<unknown>;
    evaluateCompliance(
      context: RequestContext,
      input: EvaluateCedcoComplianceBody,
    ): Promise<unknown>;
    evaluateHandoff(context: RequestContext, input: EvaluateCedcoHandoffBody): Promise<unknown>;
    createSchedulingRequest(
      context: RequestContext,
      input: CreateCedcoSchedulingRequestBody,
    ): Promise<unknown>;
    createEligibilityCheck(
      context: RequestContext,
      input: CreateCedcoEligibilityCheckBody,
    ): Promise<unknown>;
    getMetricsSummary(context: RequestContext): Promise<unknown>;
    runMockCallFlow(context: RequestContext, input: RunCedcoD02MockCallFlowBody): Promise<unknown>;
  };
  readonly operationsDashboard: {
    getDashboard(context: RequestContext): Promise<unknown>;
    getMockCallFlows(context: RequestContext): Promise<unknown>;
    getProviderEvents(context: RequestContext): Promise<unknown>;
    getEvalSummary(context: RequestContext): Promise<unknown>;
  };
}

export interface ApiRateLimitRuleInput {
  readonly method: string;
  readonly route: string;
}

export interface ApiSecurityServices {
  readonly rateLimitStore: RateLimitStorePort;
  readonly runtimeSafetyFlags: RuntimeSafetyFlags;
  getRateLimitRule(input: ApiRateLimitRuleInput): RateLimitRule;
  setRateLimitRuleForTests?: (rule: RateLimitRule) => void;
}

export interface ApiAuditRecord {
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly correlationId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly result: "success" | "failure";
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface ApiObservabilityServices {
  readonly logger: LoggerPort;
  readonly metrics: MetricsRegistryPort;
  readonly recordAuditEvent?: (event: ApiAuditRecord) => Promise<void>;
  readonly getAuditEvents?: () => readonly ApiAuditRecord[];
  readonly getLogEntries?: () => readonly NormalizedStructuredLogEntry[];
}
