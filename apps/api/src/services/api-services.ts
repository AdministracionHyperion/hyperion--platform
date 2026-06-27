import type { RequestContext } from "../http/request-context";
import type {
  LoggerPort,
  MetricsRegistryPort,
  NormalizedStructuredLogEntry,
} from "../../../../packages/observability/src";
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
} from "../contracts";

export interface ApiServices {
  readonly observability?: ApiObservabilityServices;
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
  };
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
