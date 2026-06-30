CREATE TABLE "CedcoR02CalendarResource" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "siteRef" TEXT NOT NULL,
  "serviceTypeId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02CalendarResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02ServiceType" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02ServiceType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02AvailabilitySlot" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "siteRef" TEXT NOT NULL,
  "serviceTypeId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "booked" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02Appointment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "siteRef" TEXT NOT NULL,
  "serviceTypeId" TEXT NOT NULL,
  "patientRef" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "syncStatus" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02CalendarSyncState" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "adapterMode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorClass" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "nextRetryAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02CalendarSyncState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02KnowledgeBase" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02KnowledgeBase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02KnowledgeDocument" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "knowledgeBaseId" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02KnowledgeDocumentVersion" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02KnowledgeDocumentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02KnowledgeChunk" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "textSafe" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CedcoR02KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02KnowledgeIngestionJob" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorClass" TEXT,
  "metadata" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CedcoR02KnowledgeIngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02VoiceAgent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "activeVersionId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02VoiceAgent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02VoiceAgentVersion" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "promptSafe" TEXT NOT NULL,
  "greetingSafe" TEXT NOT NULL,
  "allowedTools" JSONB NOT NULL,
  "blockedTools" JSONB NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "providerMutation" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02VoiceAgentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02AgentFlow" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "nodes" JSONB NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02AgentFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02AgentToolPolicy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "allowedTools" JSONB NOT NULL,
  "blockedTools" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02AgentToolPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02AgentKnowledgeBinding" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "knowledgeBaseId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02AgentKnowledgeBinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02AgentCalendarBinding" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02AgentCalendarBinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02HandoffTarget" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "routeRef" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CedcoR02HandoffTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CedcoR02AuditEvent" (
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
  CONSTRAINT "CedcoR02AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CedcoR02CalendarResource_tenantId_id_key" ON "CedcoR02CalendarResource"("tenantId", "id");
CREATE INDEX "CedcoR02CalendarResource_tenantId_idx" ON "CedcoR02CalendarResource"("tenantId");
CREATE INDEX "CedcoR02CalendarResource_serviceTypeId_idx" ON "CedcoR02CalendarResource"("serviceTypeId");
CREATE UNIQUE INDEX "CedcoR02ServiceType_tenantId_id_key" ON "CedcoR02ServiceType"("tenantId", "id");
CREATE INDEX "CedcoR02ServiceType_tenantId_idx" ON "CedcoR02ServiceType"("tenantId");
CREATE UNIQUE INDEX "CedcoR02AvailabilitySlot_tenantId_id_key" ON "CedcoR02AvailabilitySlot"("tenantId", "id");
CREATE INDEX "CedcoR02AvailabilitySlot_tenantId_idx" ON "CedcoR02AvailabilitySlot"("tenantId");
CREATE INDEX "CedcoR02AvailabilitySlot_resourceId_idx" ON "CedcoR02AvailabilitySlot"("resourceId");
CREATE INDEX "CedcoR02AvailabilitySlot_startsAt_idx" ON "CedcoR02AvailabilitySlot"("startsAt");
CREATE UNIQUE INDEX "CedcoR02Appointment_tenantId_id_key" ON "CedcoR02Appointment"("tenantId", "id");
CREATE INDEX "CedcoR02Appointment_tenantId_idx" ON "CedcoR02Appointment"("tenantId");
CREATE INDEX "CedcoR02Appointment_slotId_idx" ON "CedcoR02Appointment"("slotId");
CREATE INDEX "CedcoR02Appointment_status_idx" ON "CedcoR02Appointment"("status");
CREATE UNIQUE INDEX "CedcoR02CalendarSyncState_tenantId_appointmentId_adapterMode_key" ON "CedcoR02CalendarSyncState"("tenantId", "appointmentId", "adapterMode");
CREATE INDEX "CedcoR02CalendarSyncState_tenantId_idx" ON "CedcoR02CalendarSyncState"("tenantId");
CREATE INDEX "CedcoR02CalendarSyncState_status_idx" ON "CedcoR02CalendarSyncState"("status");
CREATE UNIQUE INDEX "CedcoR02KnowledgeBase_tenantId_id_key" ON "CedcoR02KnowledgeBase"("tenantId", "id");
CREATE INDEX "CedcoR02KnowledgeBase_tenantId_idx" ON "CedcoR02KnowledgeBase"("tenantId");
CREATE UNIQUE INDEX "CedcoR02KnowledgeDocument_tenantId_id_key" ON "CedcoR02KnowledgeDocument"("tenantId", "id");
CREATE INDEX "CedcoR02KnowledgeDocument_tenantId_idx" ON "CedcoR02KnowledgeDocument"("tenantId");
CREATE INDEX "CedcoR02KnowledgeDocument_knowledgeBaseId_idx" ON "CedcoR02KnowledgeDocument"("knowledgeBaseId");
CREATE INDEX "CedcoR02KnowledgeDocument_status_idx" ON "CedcoR02KnowledgeDocument"("status");
CREATE UNIQUE INDEX "CedcoR02KnowledgeDocumentVersion_tenantId_documentId_version_key" ON "CedcoR02KnowledgeDocumentVersion"("tenantId", "documentId", "version");
CREATE INDEX "CedcoR02KnowledgeDocumentVersion_tenantId_idx" ON "CedcoR02KnowledgeDocumentVersion"("tenantId");
CREATE INDEX "CedcoR02KnowledgeDocumentVersion_status_idx" ON "CedcoR02KnowledgeDocumentVersion"("status");
CREATE UNIQUE INDEX "CedcoR02KnowledgeChunk_versionId_ordinal_key" ON "CedcoR02KnowledgeChunk"("versionId", "ordinal");
CREATE INDEX "CedcoR02KnowledgeChunk_tenantId_idx" ON "CedcoR02KnowledgeChunk"("tenantId");
CREATE INDEX "CedcoR02KnowledgeChunk_documentId_idx" ON "CedcoR02KnowledgeChunk"("documentId");
CREATE INDEX "CedcoR02KnowledgeIngestionJob_tenantId_idx" ON "CedcoR02KnowledgeIngestionJob"("tenantId");
CREATE INDEX "CedcoR02KnowledgeIngestionJob_documentId_idx" ON "CedcoR02KnowledgeIngestionJob"("documentId");
CREATE INDEX "CedcoR02KnowledgeIngestionJob_status_idx" ON "CedcoR02KnowledgeIngestionJob"("status");
CREATE UNIQUE INDEX "CedcoR02VoiceAgent_tenantId_id_key" ON "CedcoR02VoiceAgent"("tenantId", "id");
CREATE INDEX "CedcoR02VoiceAgent_tenantId_idx" ON "CedcoR02VoiceAgent"("tenantId");
CREATE INDEX "CedcoR02VoiceAgent_status_idx" ON "CedcoR02VoiceAgent"("status");
CREATE UNIQUE INDEX "CedcoR02VoiceAgentVersion_tenantId_agentId_version_key" ON "CedcoR02VoiceAgentVersion"("tenantId", "agentId", "version");
CREATE INDEX "CedcoR02VoiceAgentVersion_tenantId_idx" ON "CedcoR02VoiceAgentVersion"("tenantId");
CREATE INDEX "CedcoR02VoiceAgentVersion_agentId_idx" ON "CedcoR02VoiceAgentVersion"("agentId");
CREATE INDEX "CedcoR02VoiceAgentVersion_status_idx" ON "CedcoR02VoiceAgentVersion"("status");
CREATE UNIQUE INDEX "CedcoR02AgentFlow_tenantId_id_key" ON "CedcoR02AgentFlow"("tenantId", "id");
CREATE INDEX "CedcoR02AgentFlow_tenantId_idx" ON "CedcoR02AgentFlow"("tenantId");
CREATE INDEX "CedcoR02AgentFlow_agentId_idx" ON "CedcoR02AgentFlow"("agentId");
CREATE INDEX "CedcoR02AgentToolPolicy_tenantId_idx" ON "CedcoR02AgentToolPolicy"("tenantId");
CREATE INDEX "CedcoR02AgentToolPolicy_agentId_idx" ON "CedcoR02AgentToolPolicy"("agentId");
CREATE INDEX "CedcoR02AgentKnowledgeBinding_tenantId_idx" ON "CedcoR02AgentKnowledgeBinding"("tenantId");
CREATE INDEX "CedcoR02AgentKnowledgeBinding_agentId_idx" ON "CedcoR02AgentKnowledgeBinding"("agentId");
CREATE INDEX "CedcoR02AgentKnowledgeBinding_knowledgeBaseId_idx" ON "CedcoR02AgentKnowledgeBinding"("knowledgeBaseId");
CREATE INDEX "CedcoR02AgentCalendarBinding_tenantId_idx" ON "CedcoR02AgentCalendarBinding"("tenantId");
CREATE INDEX "CedcoR02AgentCalendarBinding_agentId_idx" ON "CedcoR02AgentCalendarBinding"("agentId");
CREATE INDEX "CedcoR02AgentCalendarBinding_resourceId_idx" ON "CedcoR02AgentCalendarBinding"("resourceId");
CREATE UNIQUE INDEX "CedcoR02HandoffTarget_tenantId_id_key" ON "CedcoR02HandoffTarget"("tenantId", "id");
CREATE INDEX "CedcoR02HandoffTarget_tenantId_idx" ON "CedcoR02HandoffTarget"("tenantId");
CREATE INDEX "CedcoR02HandoffTarget_targetType_idx" ON "CedcoR02HandoffTarget"("targetType");
CREATE INDEX "CedcoR02AuditEvent_tenantId_idx" ON "CedcoR02AuditEvent"("tenantId");
CREATE INDEX "CedcoR02AuditEvent_correlationId_idx" ON "CedcoR02AuditEvent"("correlationId");
CREATE INDEX "CedcoR02AuditEvent_resourceType_resourceId_idx" ON "CedcoR02AuditEvent"("resourceType", "resourceId");
