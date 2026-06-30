import { sanitizeMetadata } from "../../../../packages/shared/src/core";
import { toPrismaJson, type HyperionPrismaClient } from "../../../../packages/db/src";
import { conflictError, notFoundError, validationError } from "../http/api-error";
import type { RequestContext } from "../http/request-context";
import type {
  AvailabilityQuery,
  CreateAgentBodyR02,
  CreateAgentVersionBodyR02,
  CreateAppointmentBody,
  CreateAvailabilityBody,
  CreateKnowledgeBaseBody,
  RescheduleAppointmentBody,
  SearchKnowledgeBody,
  SimulateAgentFlowBody,
  UploadKnowledgeDocumentBody,
} from "../contracts";
import type { ApiServices } from "./api-services";

type CedcoR02Services = ApiServices["cedcoR02"];

type R02Store = Pick<
  HyperionPrismaClient,
  | "cedcoR02AgentCalendarBinding"
  | "cedcoR02AgentFlow"
  | "cedcoR02AgentKnowledgeBinding"
  | "cedcoR02AgentToolPolicy"
  | "cedcoR02Appointment"
  | "cedcoR02AuditEvent"
  | "cedcoR02AvailabilitySlot"
  | "cedcoR02CalendarResource"
  | "cedcoR02CalendarSyncState"
  | "cedcoR02HandoffTarget"
  | "cedcoR02KnowledgeBase"
  | "cedcoR02KnowledgeChunk"
  | "cedcoR02KnowledgeDocument"
  | "cedcoR02KnowledgeDocumentVersion"
  | "cedcoR02KnowledgeIngestionJob"
  | "cedcoR02ServiceType"
  | "cedcoR02VoiceAgent"
  | "cedcoR02VoiceAgentVersion"
>;

const defaultAllowedTools = [
  "answer_from_knowledge",
  "check_availability",
  "create_appointment",
  "transfer_to_human",
  "create_followup_task",
] as const;

const defaultBlockedTools = [
  "request_sensitive_data",
  "promise_availability_without_calendar",
  "access_transcript_audio_without_approval",
] as const;

export function createPrismaCedcoR02Services(prisma: HyperionPrismaClient): CedcoR02Services {
  const service = new PrismaCedcoR02Services(prisma);
  return {
    seedDemo: (context) => service.seedDemo(context),
    listAvailability: (context, input) => service.listAvailability(context, input),
    createAvailability: (context, input) => service.createAvailability(context, input),
    listAppointments: (context) => service.listAppointments(context),
    createAppointment: (context, input) => service.createAppointment(context, input),
    cancelAppointment: (context, appointmentId) =>
      service.cancelAppointment(context, appointmentId),
    rescheduleAppointment: (context, appointmentId, input) =>
      service.rescheduleAppointment(context, appointmentId, input),
    runCalendarSyncTest: (context, appointmentId) =>
      service.runCalendarSyncTest(context, appointmentId),
    createKnowledgeBase: (context, input) => service.createKnowledgeBase(context, input),
    uploadKnowledgeDocument: (context, input) => service.uploadKnowledgeDocument(context, input),
    processKnowledgeDocument: (context, documentId) =>
      service.processKnowledgeDocument(context, documentId),
    approveKnowledgeDocument: (context, documentId) =>
      service.approveKnowledgeDocument(context, documentId),
    activateKnowledgeDocument: (context, documentId) =>
      service.activateKnowledgeDocument(context, documentId),
    searchKnowledge: (context, input) => service.searchKnowledge(context, input),
    createAgent: (context, input) => service.createAgent(context, input),
    createAgentVersion: (context, agentId, input) =>
      service.createAgentVersion(context, agentId, input),
    approveAgent: (context, versionId) => service.approveAgent(context, versionId),
    activateAgent: (context, versionId) => service.activateAgent(context, versionId),
    simulateAgentFlow: (context, input) => service.simulateAgentFlow(context, input),
    listAudit: (context) => service.listAudit(context),
  };
}

class PrismaCedcoR02Services {
  public constructor(private readonly prisma: HyperionPrismaClient) {}

  async seedDemo(context: RequestContext) {
    await this.ensureBaseRecords(this.prisma, context);
    await this.ensureDefaultAgent(this.prisma, context);
    await this.recordAudit(context, "r02_demo_seeded", "tenant", context.tenantId);

    const [
      serviceTypes,
      resources,
      availabilitySlots,
      appointments,
      knowledgeBases,
      knowledgeChunks,
      voiceAgents,
      handoffTargets,
      auditEvents,
    ] = await Promise.all([
      this.prisma.cedcoR02ServiceType.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02CalendarResource.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02AvailabilitySlot.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02Appointment.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02KnowledgeBase.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02KnowledgeChunk.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02VoiceAgent.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02HandoffTarget.count({ where: { tenantId: context.tenantId } }),
      this.prisma.cedcoR02AuditEvent.count({ where: { tenantId: context.tenantId } }),
    ]);

    return {
      tenantId: context.tenantId,
      seeded: true,
      idempotent: true,
      storageMode: "prisma",
      counts: {
        serviceTypes,
        resources,
        availabilitySlots,
        appointments,
        knowledgeBases,
        knowledgeChunks,
        voiceAgents,
        handoffTargets,
        auditEvents,
      },
      externalProvidersUsed: false,
      transcriptAudioAccessed: false,
    };
  }

  async listAvailability(context: RequestContext, input: AvailabilityQuery) {
    const rows = await this.prisma.cedcoR02AvailabilitySlot.findMany({
      where: {
        tenantId: context.tenantId,
        status: "active",
        ...(input.siteId ? { siteRef: input.siteId } : {}),
        ...(input.serviceTypeId ? { serviceTypeId: input.serviceTypeId } : {}),
        ...(input.from || input.to
          ? {
              startsAt: {
                ...(input.from ? { gte: new Date(input.from) } : {}),
                ...(input.to ? { lte: new Date(input.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { startsAt: "asc" },
    });

    return rows
      .filter((row) => row.booked < row.capacity)
      .map((row) => ({
        slotId: row.id,
        tenantId: row.tenantId,
        resourceId: row.resourceId,
        siteId: row.siteRef,
        serviceTypeId: row.serviceTypeId,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        capacity: row.capacity,
        booked: row.booked,
        metadata: safeMetadata(row.metadata),
      }));
  }

  async createAvailability(context: RequestContext, input: CreateAvailabilityBody) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) {
      throw validationError("slot end must be after start");
    }

    await this.ensureBaseRecords(this.prisma, context);
    const row = await this.prisma.cedcoR02AvailabilitySlot.upsert({
      where: { id: input.slotId },
      create: {
        id: input.slotId,
        tenantId: context.tenantId,
        resourceId: input.resourceId,
        siteRef: input.siteId,
        serviceTypeId: input.serviceTypeId,
        startsAt,
        endsAt,
        capacity: input.capacity,
        booked: 0,
        status: "active",
        metadata: toPrismaJson(input.metadata ?? {}),
      },
      update: {
        tenantId: context.tenantId,
        resourceId: input.resourceId,
        siteRef: input.siteId,
        serviceTypeId: input.serviceTypeId,
        startsAt,
        endsAt,
        capacity: input.capacity,
        status: "active",
        metadata: toPrismaJson(input.metadata ?? {}),
      },
    });
    await this.recordAudit(context, "availability_created", "availability_slot", row.id);
    return toAvailability(row);
  }

  async listAppointments(context: RequestContext) {
    const rows = await this.prisma.cedcoR02Appointment.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { startsAt: "asc" },
    });
    return rows.map(toAppointment);
  }

  async createAppointment(context: RequestContext, input: CreateAppointmentBody) {
    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cedcoR02Appointment.findFirst({
        where: { tenantId: context.tenantId, id: input.appointmentId },
      });
      if (existing) {
        return existing;
      }

      const slot = await tx.cedcoR02AvailabilitySlot.findFirst({
        where: { tenantId: context.tenantId, id: input.slotId, status: "active" },
      });
      if (!slot) {
        throw notFoundError("slot is not available for tenant");
      }
      if (slot.booked >= slot.capacity) {
        throw conflictError("slot capacity has been reached");
      }

      await tx.cedcoR02AvailabilitySlot.update({
        where: { id: slot.id },
        data: { booked: { increment: 1 } },
      });
      return tx.cedcoR02Appointment.create({
        data: {
          id: input.appointmentId,
          tenantId: context.tenantId,
          slotId: slot.id,
          resourceId: slot.resourceId,
          siteRef: slot.siteRef,
          serviceTypeId: slot.serviceTypeId,
          patientRef: safeReference(input.patientRef, "patient"),
          status: "scheduled",
          syncStatus: "pending",
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          metadata: toPrismaJson(input.metadata ?? {}),
        },
      });
    });
    await this.recordAudit(context, "appointment_created", "appointment", row.id);
    return toAppointment(row);
  }

  async cancelAppointment(context: RequestContext, appointmentId: string) {
    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cedcoR02Appointment.findFirst({
        where: { tenantId: context.tenantId, id: appointmentId },
      });
      if (!existing) {
        throw notFoundError("appointment not found");
      }
      if (existing.status !== "cancelled") {
        await tx.cedcoR02AvailabilitySlot.updateMany({
          where: { tenantId: context.tenantId, id: existing.slotId, booked: { gt: 0 } },
          data: { booked: { decrement: 1 } },
        });
      }
      return tx.cedcoR02Appointment.update({
        where: { id: existing.id },
        data: { status: "cancelled", syncStatus: "retry_pending" },
      });
    });
    await this.recordAudit(context, "appointment_cancelled", "appointment", row.id);
    return toAppointment(row);
  }

  async rescheduleAppointment(
    context: RequestContext,
    appointmentId: string,
    input: RescheduleAppointmentBody,
  ) {
    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cedcoR02Appointment.findFirst({
        where: { tenantId: context.tenantId, id: appointmentId },
      });
      const slot = await tx.cedcoR02AvailabilitySlot.findFirst({
        where: { tenantId: context.tenantId, id: input.newSlotId, status: "active" },
      });
      if (!existing || !slot) {
        throw notFoundError("appointment or new slot not found");
      }
      if (slot.booked >= slot.capacity && slot.id !== existing.slotId) {
        throw conflictError("new slot capacity has been reached");
      }
      if (slot.id !== existing.slotId) {
        await tx.cedcoR02AvailabilitySlot.updateMany({
          where: { tenantId: context.tenantId, id: existing.slotId, booked: { gt: 0 } },
          data: { booked: { decrement: 1 } },
        });
        await tx.cedcoR02AvailabilitySlot.update({
          where: { id: slot.id },
          data: { booked: { increment: 1 } },
        });
      }
      return tx.cedcoR02Appointment.update({
        where: { id: existing.id },
        data: {
          slotId: slot.id,
          resourceId: slot.resourceId,
          siteRef: slot.siteRef,
          serviceTypeId: slot.serviceTypeId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status: "rescheduled",
          syncStatus: "retry_pending",
        },
      });
    });
    await this.recordAudit(context, "appointment_rescheduled", "appointment", row.id);
    return toAppointment(row);
  }

  async runCalendarSyncTest(context: RequestContext, appointmentId: string) {
    const appointment = await this.prisma.cedcoR02Appointment.findFirst({
      where: { tenantId: context.tenantId, id: appointmentId },
    });
    if (!appointment) {
      throw notFoundError("appointment not found");
    }

    await this.prisma.cedcoR02CalendarSyncState.upsert({
      where: {
        tenantId_appointmentId_adapterMode: {
          tenantId: context.tenantId,
          appointmentId,
          adapterMode: "disabled-google-calendar",
        },
      },
      create: {
        id: `sync-${appointmentId}-disabled-google-calendar`,
        tenantId: context.tenantId,
        appointmentId,
        adapterMode: "disabled-google-calendar",
        status: "not_required",
        errorClass: "disabled",
        metadata: toPrismaJson({ externalCredentialsUsed: false }),
      },
      update: {
        status: "not_required",
        errorClass: "disabled",
        metadata: toPrismaJson({ externalCredentialsUsed: false }),
      },
    });
    await this.recordAudit(context, "calendar_sync_test_disabled", "appointment", appointmentId);
    return {
      appointmentId,
      attempted: false,
      status: "not_required",
      errorClass: "disabled",
      metadata: { externalCredentialsUsed: false, adapterMode: "disabled-google-calendar" },
    };
  }

  async createKnowledgeBase(context: RequestContext, input: CreateKnowledgeBaseBody) {
    const row = await this.prisma.cedcoR02KnowledgeBase.upsert({
      where: { id: input.knowledgeBaseId },
      create: {
        id: input.knowledgeBaseId,
        tenantId: context.tenantId,
        name: input.name,
        description: "CEDCO R02 metadata-only knowledge base",
        status: "draft",
        metadata: toPrismaJson({ externalEmbeddingsUsed: false }),
      },
      update: {
        tenantId: context.tenantId,
        name: input.name,
        status: "draft",
        metadata: toPrismaJson({ externalEmbeddingsUsed: false }),
      },
    });
    await this.recordAudit(context, "knowledge_base_created", "knowledge_base", row.id);
    return toKnowledgeBase(row);
  }

  async uploadKnowledgeDocument(context: RequestContext, input: UploadKnowledgeDocumentBody) {
    const sourceType = classifySourceType(input.sourceName);
    if (sourceType === "pdf" || sourceType === "docx" || sourceType === "extractor_required") {
      throw validationError("binary or unknown extractor is required before ingestion");
    }
    const knowledgeBaseId = await this.ensureKnowledgeBase(context);
    const versionId = `${input.documentId}-v1`;
    const chunks = chunkKnowledgeText(input.contentText).map((text, index) => ({
      id: `${input.documentId}-chunk-${index + 1}`,
      ordinal: index,
      textSafe: text,
    }));

    const row = await this.prisma.$transaction(async (tx) => {
      const document = await tx.cedcoR02KnowledgeDocument.upsert({
        where: { id: input.documentId },
        create: {
          id: input.documentId,
          tenantId: context.tenantId,
          knowledgeBaseId,
          sourceName: sanitizeSourceName(input.sourceName),
          sourceType,
          status: "ready_for_review",
          metadata: toPrismaJson(input.metadata ?? {}),
        },
        update: {
          tenantId: context.tenantId,
          knowledgeBaseId,
          sourceName: sanitizeSourceName(input.sourceName),
          sourceType,
          status: "ready_for_review",
          metadata: toPrismaJson(input.metadata ?? {}),
        },
      });
      await tx.cedcoR02KnowledgeDocumentVersion.upsert({
        where: {
          tenantId_documentId_version: {
            tenantId: context.tenantId,
            documentId: input.documentId,
            version: 1,
          },
        },
        create: {
          id: versionId,
          tenantId: context.tenantId,
          documentId: input.documentId,
          version: 1,
          status: "ready_for_review",
          metadata: toPrismaJson({ externalEmbeddingsUsed: false }),
        },
        update: {
          status: "ready_for_review",
          approvedBy: null,
          approvedAt: null,
          metadata: toPrismaJson({ externalEmbeddingsUsed: false }),
        },
      });
      await tx.cedcoR02KnowledgeChunk.deleteMany({ where: { versionId } });
      for (const chunk of chunks) {
        await tx.cedcoR02KnowledgeChunk.create({
          data: {
            id: chunk.id,
            tenantId: context.tenantId,
            documentId: input.documentId,
            versionId,
            ordinal: chunk.ordinal,
            textSafe: chunk.textSafe,
            metadata: toPrismaJson({ sourceVersion: versionId }),
          },
        });
      }
      await tx.cedcoR02KnowledgeIngestionJob.create({
        data: {
          id: `ingest-${input.documentId}-${Date.now()}`,
          tenantId: context.tenantId,
          documentId: input.documentId,
          status: "ready_for_review",
          metadata: toPrismaJson({ chunks: chunks.length, externalEmbeddingsUsed: false }),
          startedAt: context.occurredAt,
          endedAt: new Date(),
        },
      });
      return document;
    });
    await this.recordAudit(context, "knowledge_document_uploaded", "knowledge_document", row.id);
    return {
      ...toKnowledgeDocument(row, versionId),
      chunks: chunks.map((chunk) => ({
        chunkId: chunk.id,
        documentId: row.id,
        versionId,
        textSanitized: chunk.textSafe,
        sourceOrdinal: chunk.ordinal,
      })),
    };
  }

  async processKnowledgeDocument(context: RequestContext, documentId: string) {
    const row = await this.transitionKnowledgeDocument(context, documentId, "ready_for_review");
    await this.recordAudit(
      context,
      "knowledge_document_processed",
      "knowledge_document",
      row.documentId,
    );
    return row;
  }

  async approveKnowledgeDocument(context: RequestContext, documentId: string) {
    const row = await this.transitionKnowledgeDocument(context, documentId, "approved", {
      approvedBy: context.actorId,
      approvedAt: context.occurredAt,
    });
    await this.recordAudit(
      context,
      "knowledge_document_approved",
      "knowledge_document",
      row.documentId,
    );
    return row;
  }

  async activateKnowledgeDocument(context: RequestContext, documentId: string) {
    const row = await this.transitionKnowledgeDocument(context, documentId, "active");
    await this.recordAudit(
      context,
      "knowledge_document_activated",
      "knowledge_document",
      row.documentId,
    );
    return row;
  }

  async searchKnowledge(context: RequestContext, input: SearchKnowledgeBody) {
    const activeVersions = await this.prisma.cedcoR02KnowledgeDocumentVersion.findMany({
      where: { tenantId: context.tenantId, status: "active" },
      select: { id: true },
    });
    if (activeVersions.length === 0) {
      return [];
    }

    const chunks = await this.prisma.cedcoR02KnowledgeChunk.findMany({
      where: {
        tenantId: context.tenantId,
        versionId: { in: activeVersions.map((version) => version.id) },
      },
    });
    const queryTokens = tokenize(input.queryText);
    return chunks
      .map((chunk) => ({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        versionId: chunk.versionId,
        textSanitized: chunk.textSafe,
        score: scoreChunk(chunk.textSafe, queryTokens),
      }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit);
  }

  async createAgent(context: RequestContext, _input: CreateAgentBodyR02) {
    const version = await this.ensureDefaultAgent(this.prisma, context);
    await this.recordAudit(context, "agent_created", "voice_agent", version.agentId);
    return toAgentVersion(version);
  }

  async createAgentVersion(
    context: RequestContext,
    agentId: string,
    input: CreateAgentVersionBodyR02,
  ) {
    await this.ensureDefaultAgent(this.prisma, context, agentId);
    const nextVersion = await this.nextAgentVersionNumber(context.tenantId, agentId);
    const allowedTools = input.allowedTools ?? [...defaultAllowedTools];
    const row = await this.prisma.cedcoR02VoiceAgentVersion.upsert({
      where: { id: input.versionId },
      create: {
        id: input.versionId,
        tenantId: context.tenantId,
        agentId,
        version: nextVersion,
        status: "draft",
        promptSafe: sanitizeKnowledgeText(input.prompt),
        greetingSafe: sanitizeKnowledgeText(input.greeting),
        allowedTools: toPrismaJson(allowedTools),
        blockedTools: toPrismaJson(defaultBlockedTools),
        providerMutation: false,
        metadata: toPrismaJson({ source: "r02-operational-api" }),
      },
      update: {
        tenantId: context.tenantId,
        agentId,
        status: "draft",
        promptSafe: sanitizeKnowledgeText(input.prompt),
        greetingSafe: sanitizeKnowledgeText(input.greeting),
        allowedTools: toPrismaJson(allowedTools),
        blockedTools: toPrismaJson(defaultBlockedTools),
        providerMutation: false,
        metadata: toPrismaJson({ source: "r02-operational-api" }),
      },
    });
    await this.upsertAgentBindings(context, row.agentId, row.id, allowedTools);
    await this.recordAudit(context, "agent_version_created", "voice_agent_version", row.id);
    return toAgentVersion(row);
  }

  async approveAgent(context: RequestContext, versionId: string) {
    const row = await this.transitionAgentVersion(context, versionId, "approved", {
      approvedBy: context.actorId,
      approvedAt: context.occurredAt,
    });
    await this.recordAudit(context, "agent_version_approved", "voice_agent_version", row.versionId);
    return row;
  }

  async activateAgent(context: RequestContext, versionId: string) {
    const row = await this.transitionAgentVersion(context, versionId, "active", {
      activatedAt: context.occurredAt,
    });
    await this.prisma.cedcoR02VoiceAgent.update({
      where: { id: row.agentId },
      data: { status: "active", activeVersionId: row.versionId },
    });
    await this.recordAudit(context, "agent_version_active", "voice_agent_version", row.versionId);
    return row;
  }

  async simulateAgentFlow(context: RequestContext, input: SimulateAgentFlowBody) {
    const knowledgeSources = await this.searchKnowledge(context, {
      queryText: input.queryText,
      limit: 3,
    });
    let appointmentCreated = false;
    let handoffCreated = false;
    if (input.intent === "schedule" && input.slotId && input.appointmentId && input.patientRef) {
      await this.createAppointment(context, {
        appointmentId: input.appointmentId,
        slotId: input.slotId,
        patientRef: input.patientRef,
        metadata: { source: "agent-flow-simulation" },
      });
      appointmentCreated = true;
    }
    if (input.intent === "handoff") {
      const target = await this.prisma.cedcoR02HandoffTarget.findFirst({
        where: { tenantId: context.tenantId, status: "active" },
        orderBy: { id: "asc" },
      });
      handoffCreated = Boolean(target);
    }

    const auditEventId = await this.recordAudit(
      context,
      "agent_flow_simulated",
      "agent_flow",
      input.simulationId,
      { intent: input.intent },
    );

    return {
      simulationId: safeReference(input.simulationId, "simulation"),
      tenantId: context.tenantId,
      intent: input.intent,
      responseText: buildSimulationResponse(input.intent, knowledgeSources, appointmentCreated),
      appointmentCreated,
      handoffCreated,
      googleSyncStatus: appointmentCreated ? "pending" : "not_required",
      knowledgeSources,
      auditEventId,
      externalProvidersUsed: false,
      transcriptAudioAccessed: false,
    };
  }

  async listAudit(context: RequestContext) {
    const rows = await this.prisma.cedcoR02AuditEvent.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { occurredAt: "asc" },
    });
    return rows.map((row) => ({
      auditId: row.id,
      tenantId: row.tenantId,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      actorId: row.actorId ?? "system",
      occurredAt: row.occurredAt.toISOString(),
      metadata: safeMetadata(row.metadata),
    }));
  }

  private async ensureBaseRecords(store: R02Store, context: RequestContext): Promise<void> {
    await store.cedcoR02ServiceType.upsert({
      where: { id: "consulta-general" },
      create: {
        id: "consulta-general",
        tenantId: context.tenantId,
        displayName: "Consulta general",
        durationMinutes: 30,
        status: "active",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: {
        displayName: "Consulta general",
        durationMinutes: 30,
        status: "active",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
    });
    await store.cedcoR02CalendarResource.upsert({
      where: { id: "cedco-r02-recepcion" },
      create: {
        id: "cedco-r02-recepcion",
        tenantId: context.tenantId,
        siteRef: "cedco-main-site",
        serviceTypeId: "consulta-general",
        displayName: "CEDCO R02 Agenda general",
        status: "active",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: {
        siteRef: "cedco-main-site",
        serviceTypeId: "consulta-general",
        displayName: "CEDCO R02 Agenda general",
        status: "active",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
    });
    await store.cedcoR02HandoffTarget.upsert({
      where: { id: "handoff-human-queue" },
      create: {
        id: "handoff-human-queue",
        tenantId: context.tenantId,
        targetType: "human",
        displayName: "Recepcion humana CEDCO",
        routeRef: "human_queue_demo",
        status: "active",
        metadata: toPrismaJson({ refKind: "human_queue" }),
      },
      update: {
        targetType: "human",
        displayName: "Recepcion humana CEDCO",
        routeRef: "human_queue_demo",
        status: "active",
        metadata: toPrismaJson({ refKind: "human_queue" }),
      },
    });
  }

  private async ensureKnowledgeBase(context: RequestContext): Promise<string> {
    const existing = await this.prisma.cedcoR02KnowledgeBase.findFirst({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      return existing.id;
    }
    const created = await this.prisma.cedcoR02KnowledgeBase.create({
      data: {
        id: `${context.tenantId}-kb-r02-default`,
        tenantId: context.tenantId,
        name: "CEDCO R02 Default Knowledge",
        description: "Default metadata-only R02 knowledge base",
        status: "draft",
        metadata: toPrismaJson({ externalEmbeddingsUsed: false }),
      },
    });
    return created.id;
  }

  private async ensureDefaultAgent(
    store: R02Store,
    context: RequestContext,
    agentId = "cedco-r02-recepcion-agendamiento",
  ) {
    await store.cedcoR02VoiceAgent.upsert({
      where: { id: agentId },
      create: {
        id: agentId,
        tenantId: context.tenantId,
        displayName: "CEDCO R02 Recepcion y Agendamiento",
        locale: "es-CO",
        status: "draft",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: {
        displayName: "CEDCO R02 Recepcion y Agendamiento",
        locale: "es-CO",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
    });
    const version = await store.cedcoR02VoiceAgentVersion.upsert({
      where: { id: "cedco-r02-recepcion-v1" },
      create: {
        id: "cedco-r02-recepcion-v1",
        tenantId: context.tenantId,
        agentId,
        version: 1,
        status: "active",
        promptSafe:
          "Responde en espanol Colombia, consulta conocimiento aprobado y agenda interna antes de confirmar.",
        greetingSafe: "Hola, gracias por comunicarte con CEDCO. En que puedo ayudarte?",
        allowedTools: toPrismaJson(defaultAllowedTools),
        blockedTools: toPrismaJson(defaultBlockedTools),
        activatedAt: context.occurredAt,
        providerMutation: false,
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: {
        status: "active",
        allowedTools: toPrismaJson(defaultAllowedTools),
        blockedTools: toPrismaJson(defaultBlockedTools),
        providerMutation: false,
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
    });
    await store.cedcoR02VoiceAgent.update({
      where: { id: agentId },
      data: { status: "active", activeVersionId: version.id },
    });
    await this.upsertAgentBindings(context, agentId, version.id, defaultAllowedTools);
    return version;
  }

  private async upsertAgentBindings(
    context: RequestContext,
    agentId: string,
    versionId: string,
    allowedTools: readonly string[],
  ): Promise<void> {
    await this.prisma.cedcoR02AgentToolPolicy.upsert({
      where: { id: `${versionId}-tool-policy` },
      create: {
        id: `${versionId}-tool-policy`,
        tenantId: context.tenantId,
        agentId,
        versionId,
        allowedTools: toPrismaJson(allowedTools),
        blockedTools: toPrismaJson(defaultBlockedTools),
        status: "active",
        metadata: toPrismaJson({ providerMutationAllowed: false }),
      },
      update: {
        allowedTools: toPrismaJson(allowedTools),
        blockedTools: toPrismaJson(defaultBlockedTools),
        status: "active",
      },
    });
    const kbId = await this.ensureKnowledgeBase(context);
    await this.prisma.cedcoR02AgentKnowledgeBinding.upsert({
      where: { id: `${versionId}-knowledge-binding` },
      create: {
        id: `${versionId}-knowledge-binding`,
        tenantId: context.tenantId,
        agentId,
        versionId,
        knowledgeBaseId: kbId,
        status: "active",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: { knowledgeBaseId: kbId, status: "active" },
    });
    await this.prisma.cedcoR02AgentCalendarBinding.upsert({
      where: { id: `${versionId}-calendar-binding` },
      create: {
        id: `${versionId}-calendar-binding`,
        tenantId: context.tenantId,
        agentId,
        versionId,
        resourceId: "cedco-r02-recepcion",
        status: "active",
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: { resourceId: "cedco-r02-recepcion", status: "active" },
    });
    await this.prisma.cedcoR02AgentFlow.upsert({
      where: { id: `${versionId}-flow` },
      create: {
        id: `${versionId}-flow`,
        tenantId: context.tenantId,
        agentId,
        versionId,
        status: "active",
        nodes: toPrismaJson(["greeting", "intent", "knowledge", "availability", "appointment"]),
        metadata: toPrismaJson({ source: "r02-demo-seed" }),
      },
      update: {
        status: "active",
        nodes: toPrismaJson(["greeting", "intent", "knowledge", "availability", "appointment"]),
      },
    });
  }

  private async nextAgentVersionNumber(tenantId: string, agentId: string): Promise<number> {
    const latest = await this.prisma.cedcoR02VoiceAgentVersion.findFirst({
      where: { tenantId, agentId },
      orderBy: { version: "desc" },
    });
    return (latest?.version ?? 0) + 1;
  }

  private async transitionKnowledgeDocument(
    context: RequestContext,
    documentId: string,
    status: string,
    patch: { readonly approvedBy?: string; readonly approvedAt?: Date } = {},
  ) {
    const existing = await this.prisma.cedcoR02KnowledgeDocument.findFirst({
      where: { tenantId: context.tenantId, id: documentId },
    });
    if (!existing) {
      throw notFoundError("knowledge document not found");
    }
    const version = await this.prisma.cedcoR02KnowledgeDocumentVersion.findFirst({
      where: { tenantId: context.tenantId, documentId },
      orderBy: { version: "desc" },
    });
    const row = await this.prisma.cedcoR02KnowledgeDocument.update({
      where: { id: existing.id },
      data: { status },
    });
    if (version) {
      await this.prisma.cedcoR02KnowledgeDocumentVersion.update({
        where: { id: version.id },
        data: {
          status,
          ...(patch.approvedBy ? { approvedBy: patch.approvedBy } : {}),
          ...(patch.approvedAt ? { approvedAt: patch.approvedAt } : {}),
        },
      });
    }
    return toKnowledgeDocument(row, version?.id ?? `${documentId}-v1`);
  }

  private async transitionAgentVersion(
    context: RequestContext,
    versionId: string,
    status: string,
    patch: {
      readonly approvedBy?: string;
      readonly approvedAt?: Date;
      readonly activatedAt?: Date;
    },
  ) {
    const existing = await this.prisma.cedcoR02VoiceAgentVersion.findFirst({
      where: { tenantId: context.tenantId, id: versionId },
    });
    if (!existing) {
      throw notFoundError("agent version not found");
    }
    const row = await this.prisma.cedcoR02VoiceAgentVersion.update({
      where: { id: existing.id },
      data: {
        status,
        ...(patch.approvedBy ? { approvedBy: patch.approvedBy } : {}),
        ...(patch.approvedAt ? { approvedAt: patch.approvedAt } : {}),
        ...(patch.activatedAt ? { activatedAt: patch.activatedAt } : {}),
      },
    });
    return toAgentVersion(row);
  }

  private async recordAudit(
    context: RequestContext,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Readonly<Record<string, unknown>> = {},
  ): Promise<string> {
    const id = `r02-audit-${context.correlationId}-${action}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    await this.prisma.cedcoR02AuditEvent.create({
      data: {
        id,
        tenantId: context.tenantId,
        actorId: context.actorId,
        correlationId: context.correlationId,
        action,
        resourceType,
        resourceId: safeReference(resourceId, "resource"),
        result: "success",
        metadata: toPrismaJson(metadata),
        occurredAt: context.occurredAt,
      },
    });
    return id;
  }
}

function toAvailability(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly resourceId: string;
  readonly siteRef: string;
  readonly serviceTypeId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly capacity: number;
  readonly booked: number;
  readonly metadata: unknown;
}) {
  return {
    slotId: row.id,
    tenantId: row.tenantId,
    resourceId: row.resourceId,
    siteId: row.siteRef,
    serviceTypeId: row.serviceTypeId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    capacity: row.capacity,
    booked: row.booked,
    metadata: safeMetadata(row.metadata),
  };
}

function toAppointment(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly slotId: string;
  readonly resourceId: string;
  readonly siteRef: string;
  readonly serviceTypeId: string;
  readonly patientRef: string;
  readonly status: string;
  readonly syncStatus: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly metadata: unknown;
}) {
  return {
    appointmentId: row.id,
    tenantId: row.tenantId,
    slotId: row.slotId,
    resourceId: row.resourceId,
    siteId: row.siteRef,
    serviceTypeId: row.serviceTypeId,
    patientRef: row.patientRef,
    status: row.status,
    syncStatus: row.syncStatus,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    metadata: safeMetadata(row.metadata),
  };
}

function toKnowledgeBase(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly status: string;
  readonly metadata: unknown;
}) {
  return {
    knowledgeBaseId: row.id,
    tenantId: row.tenantId,
    name: row.name,
    status: row.status,
    metadata: safeMetadata(row.metadata),
  };
}

function toKnowledgeDocument(
  row: {
    readonly id: string;
    readonly tenantId: string;
    readonly sourceName: string;
    readonly sourceType: string;
    readonly status: string;
    readonly metadata: unknown;
  },
  versionId: string,
) {
  return {
    documentId: row.id,
    versionId,
    tenantId: row.tenantId,
    sourceName: row.sourceName,
    sourceType: row.sourceType,
    status: row.status,
    metadata: safeMetadata(row.metadata),
  };
}

function toAgentVersion(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly agentId: string;
  readonly status: string;
  readonly greetingSafe: string;
  readonly promptSafe: string;
  readonly allowedTools: unknown;
  readonly blockedTools: unknown;
  readonly providerMutation: boolean;
  readonly metadata: unknown;
}) {
  return {
    versionId: row.id,
    tenantId: row.tenantId,
    agentId: row.agentId,
    status: row.status,
    greeting: row.greetingSafe,
    prompt: row.promptSafe,
    allowedTools: stringArray(row.allowedTools),
    prohibitedTools: stringArray(row.blockedTools),
    knowledgeBindingRequired: true,
    calendarBindingRequired: true,
    providerMutationAllowed: false,
    providerMutationExecuted: row.providerMutation,
    metadata: safeMetadata(row.metadata),
  };
}

function safeMetadata(value: unknown) {
  return sanitizeMetadata(
    value && typeof value === "object" ? (value as Readonly<Record<string, unknown>>) : {},
  );
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function classifySourceType(
  sourceName: string,
): "txt" | "md" | "csv" | "json" | "pdf" | "docx" | "extractor_required" {
  const lower = sourceName.toLowerCase();
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".md")) return "md";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "extractor_required";
}

function sanitizeSourceName(sourceName: string): string {
  return sourceName.replace(/[^a-zA-Z0-9._-]/gu, "_").slice(0, 120);
}

function chunkKnowledgeText(text: string): string[] {
  const sanitized = sanitizeKnowledgeText(text);
  const chunks: string[] = [];
  for (let index = 0; index < sanitized.length; index += 500) {
    const chunk = sanitized.slice(index, index + 500).trim();
    if (chunk) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

function sanitizeKnowledgeText(text: string): string {
  return text
    .replace(/[^@\s]+@[^@\s]+\.[^@\s]+/gu, "[REDACTED]")
    .replace(/\+\d[\d\s().-]{7,}\d/gu, "[REDACTED]")
    .replace(/\b(?:agent|phnum|phone_number|conversation)_[A-Za-z0-9]{6,}\b/gu, "[REDACTED]")
    .slice(0, 20_000);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/iu)
    .filter((token) => token.length > 2);
}

function scoreChunk(text: string, queryTokens: readonly string[]): number {
  const lower = text.toLowerCase();
  return queryTokens.reduce((score, token) => score + (lower.includes(token) ? 1 : 0), 0);
}

function buildSimulationResponse(
  intent: SimulateAgentFlowBody["intent"],
  sources: readonly unknown[],
  appointmentCreated: boolean,
): string {
  if (appointmentCreated) {
    return "La cita interna quedo creada; la sincronizacion externa permanece deshabilitada o pendiente.";
  }
  if (intent === "handoff") {
    return "Voy a transferir el caso a un asesor humano autorizado.";
  }
  if (sources.length > 0) {
    return "Encontre informacion aprobada en la base de conocimiento activa.";
  }
  return "No tengo suficiente informacion aprobada; genero handoff si el usuario lo solicita.";
}

function safeReference(value: string, prefix: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, "-")
    .replace(/-+/gu, "-")
    .slice(0, 120);
  return normalized.length > 0 ? normalized : `${prefix}-ref`;
}
