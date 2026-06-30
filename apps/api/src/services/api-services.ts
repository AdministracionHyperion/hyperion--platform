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
  CreateAgentBodyR02,
  CreateAgentVersionBodyR02,
  CreateAppointmentBody,
  CreateAvailabilityBody,
  CreateKnowledgeBaseBody,
  AvailabilityQuery,
  CreateVoiceCallBody,
  CreateVoiceCallEventBody,
  EvaluateCedcoComplianceBody,
  EvaluateCedcoHandoffBody,
  EvaluateCedcoReadinessBody,
  RescheduleAppointmentBody,
  MockProviderEventBody,
  RunCedcoD02DialerDryRunBody,
  RunCedcoD02MockCallFlowBody,
  SearchKnowledgeBody,
  SimulateAgentFlowBody,
  InternalDialerDryRunBody,
  UploadKnowledgeDocumentBody,
  UpsertHandoffTargetBody,
} from "../contracts";

export interface ApiServices {
  readonly auth?: ApiAuthServices;
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
    runDialerDryRun(context: RequestContext, input: RunCedcoD02DialerDryRunBody): Promise<unknown>;
    runMockCallFlow(context: RequestContext, input: RunCedcoD02MockCallFlowBody): Promise<unknown>;
  };
  readonly cedcoR02: {
    seedDemo(context: RequestContext): Promise<unknown>;
    listAvailability(context: RequestContext, input: AvailabilityQuery): Promise<unknown>;
    createAvailability(context: RequestContext, input: CreateAvailabilityBody): Promise<unknown>;
    listAppointments(context: RequestContext): Promise<unknown>;
    createAppointment(context: RequestContext, input: CreateAppointmentBody): Promise<unknown>;
    cancelAppointment(context: RequestContext, appointmentId: string): Promise<unknown>;
    rescheduleAppointment(
      context: RequestContext,
      appointmentId: string,
      input: RescheduleAppointmentBody,
    ): Promise<unknown>;
    runCalendarSyncDryRun(context: RequestContext, appointmentId: string): Promise<unknown>;
    runCalendarSyncTest(context: RequestContext, appointmentId: string): Promise<unknown>;
    createKnowledgeBase(context: RequestContext, input: CreateKnowledgeBaseBody): Promise<unknown>;
    listKnowledgeBases(context: RequestContext): Promise<unknown>;
    uploadKnowledgeDocument(
      context: RequestContext,
      input: UploadKnowledgeDocumentBody,
    ): Promise<unknown>;
    listKnowledgeDocuments(context: RequestContext): Promise<unknown>;
    processKnowledgeDocument(context: RequestContext, documentId: string): Promise<unknown>;
    approveKnowledgeDocument(context: RequestContext, documentId: string): Promise<unknown>;
    activateKnowledgeDocument(context: RequestContext, documentId: string): Promise<unknown>;
    searchKnowledge(context: RequestContext, input: SearchKnowledgeBody): Promise<unknown>;
    createAgent(context: RequestContext, input: CreateAgentBodyR02): Promise<unknown>;
    listAgents(context: RequestContext): Promise<unknown>;
    createAgentVersion(
      context: RequestContext,
      agentId: string,
      input: CreateAgentVersionBodyR02,
    ): Promise<unknown>;
    approveAgent(context: RequestContext, agentId: string): Promise<unknown>;
    activateAgent(context: RequestContext, agentId: string): Promise<unknown>;
    simulateAgentFlow(context: RequestContext, input: SimulateAgentFlowBody): Promise<unknown>;
    listHandoffTargets(context: RequestContext): Promise<unknown>;
    upsertHandoffTarget(context: RequestContext, input: UpsertHandoffTargetBody): Promise<unknown>;
    listAudit(context: RequestContext): Promise<unknown>;
  };
  readonly operationsDashboard: {
    getDashboard(context: RequestContext): Promise<unknown>;
    getMockCallFlows(context: RequestContext): Promise<unknown>;
    getProviderEvents(context: RequestContext): Promise<unknown>;
    getEvalSummary(context: RequestContext): Promise<unknown>;
  };
  readonly internalDialer: {
    getReadiness(context: RequestContext): Promise<unknown>;
    dryRun(context: RequestContext, input: InternalDialerDryRunBody): Promise<unknown>;
  };
}

export interface LocalAuthLoginInput {
  readonly tenantId: string;
  readonly loginRef: string;
  readonly credential: string;
  readonly userAgent?: string;
}

export interface LocalAuthPrincipal {
  readonly tenantId: string;
  readonly actorId: string;
  readonly displayName?: string;
  readonly roles: string[];
  readonly loginRef: string;
  readonly resetRequired: boolean;
  readonly sessionId?: string;
  readonly expiresAt?: Date;
}

export interface LocalAuthLoginResult {
  readonly sessionToken: string;
  readonly principal: LocalAuthPrincipal;
}

export interface ApiAuthServices {
  login(input: LocalAuthLoginInput): Promise<LocalAuthLoginResult>;
  resolveSession(sessionToken: string, tenantId?: string): Promise<LocalAuthPrincipal | undefined>;
  logout(sessionToken: string): Promise<{ revoked: boolean }>;
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
