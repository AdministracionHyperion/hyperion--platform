-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "locale" TEXT,
    "timezone" TEXT,
    "dataRetentionDays" INTEGER,
    "piiPolicy" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roles" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "correlationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "flagKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionedResource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersionedResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "correlationId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "correlationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "promptVersionId" TEXT,
    "flowVersionId" TEXT,
    "knowledgeBaseVersionId" TEXT,
    "capabilities" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "AgentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDeployment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentVersionId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deployedBy" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "AgentDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "policy" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowDefinition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "FlowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "knowledgeBaseId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "retrievalPolicy" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeBaseVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "knowledgeBaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalScenario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expectedBehavior" TEXT NOT NULL,
    "forbiddenBehavior" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentVersionId" TEXT,
    "status" TEXT NOT NULL,
    "startedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "evalRunId" TEXT NOT NULL,
    "evalScenarioId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "findings" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "agentRuntimeRef" JSONB,
    "knowledgeRuntimeRef" JSONB,
    "correlationId" TEXT NOT NULL,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallParticipant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "displayAlias" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTurn" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contentRedacted" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "actorId" TEXT,
    "correlationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCallEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT,
    "providerName" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "providerCallId" TEXT,
    "status" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderCallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCallResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "redactedSummary" TEXT,
    "outcome" TEXT,
    "handoffRecommended" BOOLEAN,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostCallResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoffRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "targetQueue" TEXT NOT NULL,
    "redactedSummary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "HandoffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoffAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "handoffId" TEXT NOT NULL,
    "assignedToActorId" TEXT NOT NULL,
    "assignedByActorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "HandoffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoSite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CedcoSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoService" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "availableSiteIds" JSONB NOT NULL,
    "requiresEligibilityCheck" BOOLEAN NOT NULL,
    "requiresSchedulingIntegration" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CedcoService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoAgreement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "applicableServiceIds" JSONB NOT NULL,
    "notesRedacted" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CedcoAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoD02Configuration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "activeAgentVersionId" TEXT,
    "activePromptVersionId" TEXT,
    "activeFlowVersionId" TEXT,
    "activeKnowledgeBaseVersionId" TEXT,
    "allowedSiteIds" JSONB NOT NULL,
    "allowedServiceIds" JSONB NOT NULL,
    "handoffEnabled" BOOLEAN NOT NULL,
    "schedulingMode" TEXT NOT NULL,
    "eligibilityMode" TEXT NOT NULL,
    "realCallsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CedcoD02Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoSchedulingRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT,
    "patientContextRef" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "siteId" TEXT,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CedcoSchedulingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoEligibilityCheck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientContextRef" TEXT NOT NULL,
    "agreementId" TEXT,
    "serviceId" TEXT,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CedcoEligibilityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoD02EvalScenario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expectedBehavior" TEXT NOT NULL,
    "forbiddenBehavior" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CedcoD02EvalScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CedcoD02Metric" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimensions" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CedcoD02Metric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "TenantMembership_tenantId_idx" ON "TenantMembership"("tenantId");

-- CreateIndex
CREATE INDEX "TenantMembership_userId_idx" ON "TenantMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMembership_tenantId_userId_key" ON "TenantMembership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "FeatureFlag_flagKey_idx" ON "FeatureFlag"("flagKey");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_tenantId_flagKey_key" ON "FeatureFlag"("tenantId", "flagKey");

-- CreateIndex
CREATE INDEX "VersionedResource_tenantId_resourceType_resourceId_status_idx" ON "VersionedResource"("tenantId", "resourceType", "resourceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VersionedResource_tenantId_resourceType_resourceId_versionN_key" ON "VersionedResource"("tenantId", "resourceType", "resourceId", "versionNumber");

-- CreateIndex
CREATE INDEX "FeedbackEvent_tenantId_idx" ON "FeedbackEvent"("tenantId");

-- CreateIndex
CREATE INDEX "FeedbackEvent_resourceType_resourceId_idx" ON "FeedbackEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "FeedbackEvent_correlationId_idx" ON "FeedbackEvent"("correlationId");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenantId_idx" ON "OutboxEvent"("tenantId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_idx" ON "OutboxEvent"("status");

-- CreateIndex
CREATE INDEX "OutboxEvent_correlationId_idx" ON "OutboxEvent"("correlationId");

-- CreateIndex
CREATE INDEX "Agent_tenantId_idx" ON "Agent"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_tenantId_id_key" ON "Agent"("tenantId", "id");

-- CreateIndex
CREATE INDEX "AgentVersion_tenantId_agentId_status_idx" ON "AgentVersion"("tenantId", "agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentVersion_tenantId_agentId_versionNumber_key" ON "AgentVersion"("tenantId", "agentId", "versionNumber");

-- CreateIndex
CREATE INDEX "AgentDeployment_tenantId_idx" ON "AgentDeployment"("tenantId");

-- CreateIndex
CREATE INDEX "AgentDeployment_agentId_idx" ON "AgentDeployment"("agentId");

-- CreateIndex
CREATE INDEX "PromptTemplate_tenantId_idx" ON "PromptTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_tenantId_id_key" ON "PromptTemplate"("tenantId", "id");

-- CreateIndex
CREATE INDEX "PromptVersion_tenantId_promptId_status_idx" ON "PromptVersion"("tenantId", "promptId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_tenantId_promptId_versionNumber_key" ON "PromptVersion"("tenantId", "promptId", "versionNumber");

-- CreateIndex
CREATE INDEX "FlowDefinition_tenantId_idx" ON "FlowDefinition"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowDefinition_tenantId_id_key" ON "FlowDefinition"("tenantId", "id");

-- CreateIndex
CREATE INDEX "FlowVersion_tenantId_flowId_status_idx" ON "FlowVersion"("tenantId", "flowId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FlowVersion_tenantId_flowId_versionNumber_key" ON "FlowVersion"("tenantId", "flowId", "versionNumber");

-- CreateIndex
CREATE INDEX "KnowledgeBase_tenantId_idx" ON "KnowledgeBase"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_tenantId_id_key" ON "KnowledgeBase"("tenantId", "id");

-- CreateIndex
CREATE INDEX "KnowledgeBaseVersion_tenantId_knowledgeBaseId_status_idx" ON "KnowledgeBaseVersion"("tenantId", "knowledgeBaseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseVersion_tenantId_knowledgeBaseId_versionNumber_key" ON "KnowledgeBaseVersion"("tenantId", "knowledgeBaseId", "versionNumber");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_tenantId_idx" ON "KnowledgeDocument"("tenantId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_knowledgeBaseId_idx" ON "KnowledgeDocument"("knowledgeBaseId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_tenantId_idx" ON "KnowledgeChunk"("tenantId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_documentId_ordinal_key" ON "KnowledgeChunk"("documentId", "ordinal");

-- CreateIndex
CREATE INDEX "EvalScenario_tenantId_idx" ON "EvalScenario"("tenantId");

-- CreateIndex
CREATE INDEX "EvalScenario_category_idx" ON "EvalScenario"("category");

-- CreateIndex
CREATE INDEX "EvalRun_tenantId_idx" ON "EvalRun"("tenantId");

-- CreateIndex
CREATE INDEX "EvalRun_status_idx" ON "EvalRun"("status");

-- CreateIndex
CREATE INDEX "EvalResult_tenantId_idx" ON "EvalResult"("tenantId");

-- CreateIndex
CREATE INDEX "EvalResult_evalRunId_idx" ON "EvalResult"("evalRunId");

-- CreateIndex
CREATE INDEX "CallSession_tenantId_idx" ON "CallSession"("tenantId");

-- CreateIndex
CREATE INDEX "CallSession_status_idx" ON "CallSession"("status");

-- CreateIndex
CREATE INDEX "CallSession_correlationId_idx" ON "CallSession"("correlationId");

-- CreateIndex
CREATE INDEX "CallParticipant_tenantId_idx" ON "CallParticipant"("tenantId");

-- CreateIndex
CREATE INDEX "CallParticipant_callId_idx" ON "CallParticipant"("callId");

-- CreateIndex
CREATE INDEX "ConversationTurn_tenantId_idx" ON "ConversationTurn"("tenantId");

-- CreateIndex
CREATE INDEX "ConversationTurn_callId_idx" ON "ConversationTurn"("callId");

-- CreateIndex
CREATE INDEX "CallEvent_tenantId_idx" ON "CallEvent"("tenantId");

-- CreateIndex
CREATE INDEX "CallEvent_callId_idx" ON "CallEvent"("callId");

-- CreateIndex
CREATE INDEX "CallEvent_correlationId_idx" ON "CallEvent"("correlationId");

-- CreateIndex
CREATE INDEX "ProviderCallEvent_tenantId_idx" ON "ProviderCallEvent"("tenantId");

-- CreateIndex
CREATE INDEX "ProviderCallEvent_callId_idx" ON "ProviderCallEvent"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCallEvent_providerName_providerEventId_key" ON "ProviderCallEvent"("providerName", "providerEventId");

-- CreateIndex
CREATE INDEX "PostCallResult_tenantId_idx" ON "PostCallResult"("tenantId");

-- CreateIndex
CREATE INDEX "PostCallResult_callId_idx" ON "PostCallResult"("callId");

-- CreateIndex
CREATE INDEX "HandoffRequest_tenantId_idx" ON "HandoffRequest"("tenantId");

-- CreateIndex
CREATE INDEX "HandoffRequest_callId_idx" ON "HandoffRequest"("callId");

-- CreateIndex
CREATE INDEX "HandoffRequest_status_idx" ON "HandoffRequest"("status");

-- CreateIndex
CREATE INDEX "HandoffAssignment_tenantId_idx" ON "HandoffAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "HandoffAssignment_handoffId_idx" ON "HandoffAssignment"("handoffId");

-- CreateIndex
CREATE INDEX "CedcoSite_tenantId_idx" ON "CedcoSite"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CedcoSite_tenantId_id_key" ON "CedcoSite"("tenantId", "id");

-- CreateIndex
CREATE INDEX "CedcoService_tenantId_idx" ON "CedcoService"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CedcoService_tenantId_id_key" ON "CedcoService"("tenantId", "id");

-- CreateIndex
CREATE INDEX "CedcoAgreement_tenantId_idx" ON "CedcoAgreement"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CedcoAgreement_tenantId_id_key" ON "CedcoAgreement"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CedcoD02Configuration_tenantId_key" ON "CedcoD02Configuration"("tenantId");

-- CreateIndex
CREATE INDEX "CedcoSchedulingRequest_tenantId_idx" ON "CedcoSchedulingRequest"("tenantId");

-- CreateIndex
CREATE INDEX "CedcoSchedulingRequest_callId_idx" ON "CedcoSchedulingRequest"("callId");

-- CreateIndex
CREATE INDEX "CedcoEligibilityCheck_tenantId_idx" ON "CedcoEligibilityCheck"("tenantId");

-- CreateIndex
CREATE INDEX "CedcoD02EvalScenario_tenantId_idx" ON "CedcoD02EvalScenario"("tenantId");

-- CreateIndex
CREATE INDEX "CedcoD02EvalScenario_intent_idx" ON "CedcoD02EvalScenario"("intent");

-- CreateIndex
CREATE INDEX "CedcoD02Metric_tenantId_idx" ON "CedcoD02Metric"("tenantId");

-- CreateIndex
CREATE INDEX "CedcoD02Metric_key_idx" ON "CedcoD02Metric"("key");

-- CreateIndex
CREATE INDEX "CedcoD02Metric_occurredAt_idx" ON "CedcoD02Metric"("occurredAt");

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

