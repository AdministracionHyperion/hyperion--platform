import {
  createSafeMetadata,
  domainError,
  fail,
  ok,
  redactedMetadataValue,
  validateSafeIdentifier,
  type DomainError,
  type OperationContext,
  type Result,
  type SafeMetadata,
} from "../../../../../packages/shared/src/core";

export const cedcoR02Permissions = [
  "r02.agents.read",
  "r02.agents.write",
  "r02.knowledge.read",
  "r02.knowledge.write",
  "r02.knowledge.approve",
  "r02.calendar.read",
  "r02.calendar.write",
  "r02.google_calendar.sync",
  "r02.calls.read",
  "r02.webhooks.read",
  "r02.pbx.read",
  "r02.pbx.write",
  "r02.reports.read",
  "r02.compliance.approve",
  "r02.handoff.read",
  "r02.handoff.write",
] as const;

export type CedcoR02Permission = (typeof cedcoR02Permissions)[number];

export const cedcoR02Roles: Readonly<Record<string, readonly CedcoR02Permission[]>> = {
  super_admin_hyperion: cedcoR02Permissions,
  cedco_admin: [
    "r02.agents.read",
    "r02.agents.write",
    "r02.knowledge.read",
    "r02.knowledge.write",
    "r02.knowledge.approve",
    "r02.calendar.read",
    "r02.calendar.write",
    "r02.google_calendar.sync",
    "r02.calls.read",
    "r02.webhooks.read",
    "r02.pbx.read",
    "r02.pbx.write",
    "r02.reports.read",
    "r02.compliance.approve",
    "r02.handoff.read",
    "r02.handoff.write",
  ],
  r02_operator: [
    "r02.agents.read",
    "r02.knowledge.read",
    "r02.calendar.read",
    "r02.calendar.write",
    "r02.calls.read",
    "r02.handoff.read",
    "r02.handoff.write",
  ],
  compliance_auditor: [
    "r02.knowledge.read",
    "r02.calls.read",
    "r02.webhooks.read",
    "r02.reports.read",
    "r02.compliance.approve",
  ],
  reports_viewer: ["r02.calls.read", "r02.webhooks.read", "r02.reports.read"],
  integration_admin: [
    "r02.calendar.read",
    "r02.google_calendar.sync",
    "r02.webhooks.read",
    "r02.pbx.read",
    "r02.pbx.write",
  ],
  human_handoff_agent: [
    "r02.calendar.read",
    "r02.calls.read",
    "r02.handoff.read",
    "r02.handoff.write",
  ],
};

export type AppointmentStatus = "scheduled" | "rescheduled" | "cancelled" | "completed" | "no_show";
export type CalendarSyncStatus = "not_required" | "pending" | "synced" | "failed" | "retry_pending";
export type KnowledgeSourceStatus =
  | "draft"
  | "uploaded"
  | "processing"
  | "ready_for_review"
  | "approved"
  | "active"
  | "archived"
  | "failed";
export type AgentReleaseStatus = "draft" | "review" | "approved" | "active" | "archived";
export type InboundHandoffTarget = "human" | "pbx" | "twilio_fallback";

export interface CalendarResource {
  readonly resourceId: string;
  readonly tenantId: string;
  readonly siteId: string;
  readonly serviceTypeId: string;
  readonly displayName: string;
  readonly metadata: SafeMetadata;
}

export interface AvailabilitySlot {
  readonly slotId: string;
  readonly tenantId: string;
  readonly resourceId: string;
  readonly siteId: string;
  readonly serviceTypeId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly capacity: number;
  readonly booked: number;
  readonly metadata: SafeMetadata;
}

export interface Appointment {
  readonly appointmentId: string;
  readonly tenantId: string;
  readonly slotId: string;
  readonly resourceId: string;
  readonly siteId: string;
  readonly serviceTypeId: string;
  readonly patientRef: string;
  readonly status: AppointmentStatus;
  readonly syncStatus: CalendarSyncStatus;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly metadata: SafeMetadata;
}

export interface AppointmentAuditEvent {
  readonly auditId: string;
  readonly appointmentId: string;
  readonly tenantId: string;
  readonly action: "created" | "rescheduled" | "cancelled" | "sync_attempted" | "sync_failed";
  readonly actorId: string;
  readonly occurredAt: Date;
  readonly metadata: SafeMetadata;
}

export class InMemoryR02CalendarRepository {
  private readonly resources = new Map<string, CalendarResource>();
  private readonly slots = new Map<string, AvailabilitySlot>();
  private readonly appointments = new Map<string, Appointment>();
  private readonly audit: AppointmentAuditEvent[] = [];

  upsertResource(resource: CalendarResource): void {
    this.resources.set(resource.resourceId, resource);
  }

  addAvailability(slot: AvailabilitySlot): Result<AvailabilitySlot, DomainError> {
    if (slot.endsAt <= slot.startsAt) {
      return fail(domainError("invalid_state", "slot end must be after start"));
    }
    if (slot.capacity < 1) {
      return fail(domainError("invalid_state", "slot capacity must be positive"));
    }
    this.slots.set(slot.slotId, slot);
    return ok(slot);
  }

  queryAvailability(input: {
    readonly tenantId: string;
    readonly siteId?: string;
    readonly serviceTypeId?: string;
    readonly from?: Date;
    readonly to?: Date;
  }): readonly AvailabilitySlot[] {
    return [...this.slots.values()]
      .filter((slot) => slot.tenantId === input.tenantId)
      .filter((slot) => !input.siteId || slot.siteId === input.siteId)
      .filter((slot) => !input.serviceTypeId || slot.serviceTypeId === input.serviceTypeId)
      .filter((slot) => !input.from || slot.startsAt >= input.from)
      .filter((slot) => !input.to || slot.startsAt <= input.to)
      .filter((slot) => slot.booked < slot.capacity)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  createAppointment(input: {
    readonly context: OperationContext;
    readonly appointmentId: string;
    readonly slotId: string;
    readonly patientRef: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
  }): Result<Appointment, DomainError> {
    const slot = this.slots.get(input.slotId);
    if (!slot || slot.tenantId !== input.context.tenantId) {
      return fail(domainError("not_found", "slot is not available for tenant"));
    }
    if (slot.booked >= slot.capacity) {
      return fail(domainError("conflict", "slot capacity has been reached"));
    }
    const appointmentId = validateSafeIdentifier(input.appointmentId, "appointmentId");
    if (!appointmentId.ok) return fail(appointmentId.error);
    const metadata = createSafeMetadata(input.metadata);
    if (!metadata.ok) return fail(metadata.error);

    const appointment: Appointment = {
      appointmentId: appointmentId.value,
      tenantId: input.context.tenantId,
      slotId: slot.slotId,
      resourceId: slot.resourceId,
      siteId: slot.siteId,
      serviceTypeId: slot.serviceTypeId,
      patientRef: safeReference(input.patientRef, "patient"),
      status: "scheduled",
      syncStatus: "pending",
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      metadata: metadata.value,
    };
    this.appointments.set(appointment.appointmentId, appointment);
    this.slots.set(slot.slotId, { ...slot, booked: slot.booked + 1 });
    this.audit.push(createAppointmentAudit(input.context, appointment.appointmentId, "created"));
    return ok(appointment);
  }

  rescheduleAppointment(input: {
    readonly context: OperationContext;
    readonly appointmentId: string;
    readonly newSlotId: string;
  }): Result<Appointment, DomainError> {
    const existing = this.appointments.get(input.appointmentId);
    const newSlot = this.slots.get(input.newSlotId);
    if (!existing || existing.tenantId !== input.context.tenantId || !newSlot) {
      return fail(domainError("not_found", "appointment or new slot not found"));
    }
    if (newSlot.booked >= newSlot.capacity) {
      return fail(domainError("conflict", "new slot capacity has been reached"));
    }
    const previousSlot = this.slots.get(existing.slotId);
    if (previousSlot) {
      this.slots.set(previousSlot.slotId, {
        ...previousSlot,
        booked: Math.max(0, previousSlot.booked - 1),
      });
    }
    this.slots.set(newSlot.slotId, { ...newSlot, booked: newSlot.booked + 1 });
    const updated: Appointment = {
      ...existing,
      slotId: newSlot.slotId,
      resourceId: newSlot.resourceId,
      siteId: newSlot.siteId,
      serviceTypeId: newSlot.serviceTypeId,
      startsAt: newSlot.startsAt,
      endsAt: newSlot.endsAt,
      status: "rescheduled",
      syncStatus: "retry_pending",
    };
    this.appointments.set(updated.appointmentId, updated);
    this.audit.push(createAppointmentAudit(input.context, updated.appointmentId, "rescheduled"));
    return ok(updated);
  }

  cancelAppointment(input: {
    readonly context: OperationContext;
    readonly appointmentId: string;
  }): Result<Appointment, DomainError> {
    const existing = this.appointments.get(input.appointmentId);
    if (!existing || existing.tenantId !== input.context.tenantId) {
      return fail(domainError("not_found", "appointment not found"));
    }
    const updated: Appointment = { ...existing, status: "cancelled", syncStatus: "retry_pending" };
    this.appointments.set(updated.appointmentId, updated);
    this.audit.push(createAppointmentAudit(input.context, updated.appointmentId, "cancelled"));
    return ok(updated);
  }

  listAppointments(tenantId: string): readonly Appointment[] {
    return [...this.appointments.values()].filter(
      (appointment) => appointment.tenantId === tenantId,
    );
  }

  listAudit(tenantId: string): readonly AppointmentAuditEvent[] {
    return this.audit.filter((event) => event.tenantId === tenantId);
  }
}

export interface GoogleCalendarPort {
  createEvent(appointment: Appointment): Promise<Result<GoogleCalendarSyncAudit, DomainError>>;
  updateEvent(appointment: Appointment): Promise<Result<GoogleCalendarSyncAudit, DomainError>>;
  cancelEvent(appointment: Appointment): Promise<Result<GoogleCalendarSyncAudit, DomainError>>;
}

export interface GoogleCalendarSyncAudit {
  readonly appointmentId: string;
  readonly attempted: boolean;
  readonly status: CalendarSyncStatus;
  readonly errorClass?: "disabled" | "credentials_missing" | "provider_error" | "validation_error";
  readonly metadata: SafeMetadata;
}

export class DisabledGoogleCalendarAdapter implements GoogleCalendarPort {
  async createEvent(
    appointment: Appointment,
  ): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
    return ok(disabledGoogleAudit(appointment));
  }

  async updateEvent(
    appointment: Appointment,
  ): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
    return ok(disabledGoogleAudit(appointment));
  }

  async cancelEvent(
    appointment: Appointment,
  ): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
    return ok(disabledGoogleAudit(appointment));
  }
}

export class InMemoryTestGoogleCalendarAdapter implements GoogleCalendarPort {
  readonly events = new Map<string, Appointment>();

  async createEvent(
    appointment: Appointment,
  ): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
    this.events.set(appointment.appointmentId, appointment);
    return ok(googleAudit(appointment, "synced"));
  }

  async updateEvent(
    appointment: Appointment,
  ): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
    this.events.set(appointment.appointmentId, appointment);
    return ok(googleAudit(appointment, "synced"));
  }

  async cancelEvent(
    appointment: Appointment,
  ): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
    this.events.delete(appointment.appointmentId);
    return ok(googleAudit(appointment, "synced"));
  }
}

export class FutureGoogleCalendarAdapter extends DisabledGoogleCalendarAdapter {
  readonly mode = "future-google-calendar-adapter";
}

export async function runGoogleCalendarSyncJob(input: {
  readonly appointment: Appointment;
  readonly adapter: GoogleCalendarPort;
  readonly operation: "create" | "update" | "cancel";
}): Promise<Result<GoogleCalendarSyncAudit, DomainError>> {
  if (input.operation === "create") return input.adapter.createEvent(input.appointment);
  if (input.operation === "update") return input.adapter.updateEvent(input.appointment);
  return input.adapter.cancelEvent(input.appointment);
}

export interface KnowledgeDocument {
  readonly documentId: string;
  readonly versionId: string;
  readonly tenantId: string;
  readonly sourceName: string;
  readonly sourceType: "txt" | "md" | "csv" | "json" | "pdf" | "docx" | "extractor_required";
  readonly status: KnowledgeSourceStatus;
  readonly chunks: readonly KnowledgeChunk[];
  readonly metadata: SafeMetadata;
}

export interface KnowledgeChunk {
  readonly chunkId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly tenantId: string;
  readonly textSanitized: string;
  readonly sourceOrdinal: number;
}

export interface KnowledgeRetrievalResult {
  readonly chunkId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly textSanitized: string;
  readonly score: number;
}

export class InMemoryR02KnowledgeBase {
  private readonly documents = new Map<string, KnowledgeDocument>();
  private activeVersionId: string | undefined;

  uploadDocument(input: {
    readonly context: OperationContext;
    readonly documentId: string;
    readonly sourceName: string;
    readonly contentText: string;
    readonly sizeBytes: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
  }): Result<KnowledgeDocument, DomainError> {
    const sourceType = classifySourceType(input.sourceName);
    if (input.sizeBytes > 1_000_000) {
      return fail(domainError("invalid_state", "document exceeds R02 baseline size"));
    }
    if (sourceType === "pdf" || sourceType === "docx") {
      return fail(domainError("invalid_state", "binary extractor is required before ingestion"));
    }
    const documentId = validateSafeIdentifier(input.documentId, "documentId");
    if (!documentId.ok) return fail(documentId.error);
    const metadata = createSafeMetadata(input.metadata);
    if (!metadata.ok) return fail(metadata.error);
    const versionId = `${documentId.value}-v1`;
    const chunks = chunkKnowledgeText({
      tenantId: input.context.tenantId,
      documentId: documentId.value,
      versionId,
      text: input.contentText,
    });
    const document: KnowledgeDocument = {
      documentId: documentId.value,
      versionId,
      tenantId: input.context.tenantId,
      sourceName: sanitizeSourceName(input.sourceName),
      sourceType,
      status: "ready_for_review",
      chunks,
      metadata: metadata.value,
    };
    this.documents.set(document.documentId, document);
    return ok(document);
  }

  approveDocument(
    context: OperationContext,
    documentId: string,
  ): Result<KnowledgeDocument, DomainError> {
    return this.transition(context, documentId, "approved");
  }

  activateDocument(
    context: OperationContext,
    documentId: string,
  ): Result<KnowledgeDocument, DomainError> {
    const result = this.transition(context, documentId, "active");
    if (result.ok) this.activeVersionId = result.value.versionId;
    return result;
  }

  archiveDocument(
    context: OperationContext,
    documentId: string,
  ): Result<KnowledgeDocument, DomainError> {
    return this.transition(context, documentId, "archived");
  }

  retrieve(input: {
    readonly tenantId: string;
    readonly query: string;
    readonly limit?: number;
  }): readonly KnowledgeRetrievalResult[] {
    const queryTokens = tokenize(input.query);
    const limit = input.limit ?? 5;
    return [...this.documents.values()]
      .filter((document) => document.tenantId === input.tenantId)
      .filter((document) => document.status === "active")
      .flatMap((document) =>
        document.chunks.map((chunk) => ({
          chunkId: chunk.chunkId,
          documentId: chunk.documentId,
          versionId: chunk.versionId,
          textSanitized: chunk.textSanitized,
          score: scoreChunk(chunk.textSanitized, queryTokens),
        })),
      )
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getActiveVersionId(): string | undefined {
    return this.activeVersionId;
  }

  private transition(
    context: OperationContext,
    documentId: string,
    status: KnowledgeSourceStatus,
  ): Result<KnowledgeDocument, DomainError> {
    const document = this.documents.get(documentId);
    if (!document || document.tenantId !== context.tenantId) {
      return fail(domainError("not_found", "knowledge document not found"));
    }
    const updated: KnowledgeDocument = { ...document, status };
    this.documents.set(documentId, updated);
    return ok(updated);
  }
}

export interface FutureEmbeddingProviderPort {
  embed(textSanitized: string): Promise<Result<readonly number[], DomainError>>;
}

export class DisabledEmbeddingAdapter implements FutureEmbeddingProviderPort {
  async embed(): Promise<Result<readonly number[], DomainError>> {
    return fail(domainError("forbidden", "external embeddings are disabled"));
  }
}

export type R02AgentTool =
  | "answer_from_knowledge"
  | "check_availability"
  | "create_appointment"
  | "transfer_to_human"
  | "create_followup_task";
export type R02ProhibitedAgentTool =
  | "request_sensitive_data"
  | "promise_availability_without_calendar"
  | "access_transcript_audio_without_approval";

export interface VoiceAgent {
  readonly agentId: string;
  readonly tenantId: string;
  readonly name: string;
  readonly locale: "es-CO";
  readonly status: AgentReleaseStatus;
  readonly activeVersionId?: string;
  readonly metadata: SafeMetadata;
}

export interface VoiceAgentVersion {
  readonly versionId: string;
  readonly agentId: string;
  readonly status: AgentReleaseStatus;
  readonly greeting: string;
  readonly prompt: string;
  readonly allowedTools: readonly R02AgentTool[];
  readonly prohibitedTools: readonly R02ProhibitedAgentTool[];
  readonly knowledgeBindingRequired: boolean;
  readonly calendarBindingRequired: boolean;
  readonly providerMutationAllowed: false;
  readonly metadata: SafeMetadata;
}

export class InMemoryR02AgentRepository {
  private readonly agents = new Map<string, VoiceAgent>();
  private readonly versions = new Map<string, VoiceAgentVersion>();

  createInitialAgent(context: OperationContext): Result<VoiceAgentVersion, DomainError> {
    const agent: VoiceAgent = {
      agentId: "cedco-r02-recepcion-agendamiento",
      tenantId: context.tenantId,
      name: "CEDCO R02 Recepcion y Agendamiento",
      locale: "es-CO",
      status: "draft",
      metadata: {},
    };
    const version = createInitialCedcoR02AgentVersion(agent.agentId);
    this.agents.set(agent.agentId, agent);
    this.versions.set(version.versionId, version);
    return ok(version);
  }

  approveVersion(
    context: OperationContext,
    versionId: string,
  ): Result<VoiceAgentVersion, DomainError> {
    return this.transitionVersion(context, versionId, "approved");
  }

  activateVersion(
    context: OperationContext,
    versionId: string,
  ): Result<VoiceAgentVersion, DomainError> {
    const result = this.transitionVersion(context, versionId, "active");
    if (!result.ok) return result;
    const agent = this.agents.get(result.value.agentId);
    if (agent) {
      this.agents.set(agent.agentId, { ...agent, status: "active", activeVersionId: versionId });
    }
    return result;
  }

  getAgent(agentId: string): VoiceAgent | undefined {
    return this.agents.get(agentId);
  }

  private transitionVersion(
    context: OperationContext,
    versionId: string,
    status: AgentReleaseStatus,
  ): Result<VoiceAgentVersion, DomainError> {
    const version = this.versions.get(versionId);
    if (!version) {
      return fail(domainError("not_found", "agent version not found"));
    }
    const agent = this.agents.get(version.agentId);
    if (!agent || agent.tenantId !== context.tenantId) {
      return fail(domainError("not_found", "agent not found"));
    }
    if (!validateAgentToolPolicy(version).ok) {
      return fail(domainError("forbidden", "agent tool policy is unsafe"));
    }
    const updated: VoiceAgentVersion = { ...version, status };
    this.versions.set(updated.versionId, updated);
    return ok(updated);
  }
}

export function createInitialCedcoR02AgentVersion(agentId: string): VoiceAgentVersion {
  return {
    versionId: "cedco-r02-recepcion-v1",
    agentId,
    status: "draft",
    greeting: "Hola, gracias por comunicarte con CEDCO. Te ayudaré con información y agendamiento.",
    prompt:
      "Responde en español de Colombia, tono profesional. Consulta conocimiento aprobado, revisa disponibilidad antes de prometer una cita y transfiere a un humano si hay urgencia, baja confianza o solicitud explícita.",
    allowedTools: [
      "answer_from_knowledge",
      "check_availability",
      "create_appointment",
      "transfer_to_human",
      "create_followup_task",
    ],
    prohibitedTools: [
      "request_sensitive_data",
      "promise_availability_without_calendar",
      "access_transcript_audio_without_approval",
    ],
    knowledgeBindingRequired: true,
    calendarBindingRequired: true,
    providerMutationAllowed: false,
    metadata: {},
  };
}

export function validateAgentToolPolicy(
  version: VoiceAgentVersion,
): Result<VoiceAgentVersion, DomainError> {
  if (!version.allowedTools.includes("check_availability")) {
    return fail(domainError("forbidden", "calendar availability tool is required"));
  }
  if (!version.allowedTools.includes("transfer_to_human")) {
    return fail(domainError("forbidden", "human handoff tool is required"));
  }
  if (version.providerMutationAllowed !== false) {
    return fail(domainError("forbidden", "provider mutation is blocked"));
  }
  return ok(version);
}

export interface CedcoR02FlowSpec {
  readonly stages: readonly string[];
  readonly handoffTargets: readonly InboundHandoffTarget[];
  readonly recordingEnabled: false;
  readonly transcriptAudioEnabled: false;
  readonly providerMutationAllowed: false;
}

export function createCedcoR02FlowSpec(): CedcoR02FlowSpec {
  return {
    stages: [
      "saludo",
      "deteccion-intencion",
      "respuesta-desde-rag",
      "consulta-disponibilidad",
      "agendamiento",
      "confirmacion",
      "fallback",
      "handoff",
      "cierre",
    ],
    handoffTargets: ["human", "pbx", "twilio_fallback"],
    recordingEnabled: false,
    transcriptAudioEnabled: false,
    providerMutationAllowed: false,
  };
}

export function createAvailabilitySlot(input: {
  readonly context: OperationContext;
  readonly slotId: string;
  readonly resourceId: string;
  readonly siteId: string;
  readonly serviceTypeId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly capacity?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): Result<AvailabilitySlot, DomainError> {
  const slotId = validateSafeIdentifier(input.slotId, "slotId");
  if (!slotId.ok) return fail(slotId.error);
  const metadata = createSafeMetadata(input.metadata);
  if (!metadata.ok) return fail(metadata.error);
  return ok({
    slotId: slotId.value,
    tenantId: input.context.tenantId,
    resourceId: safeReference(input.resourceId, "resource"),
    siteId: safeReference(input.siteId, "site"),
    serviceTypeId: safeReference(input.serviceTypeId, "service"),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    capacity: input.capacity ?? 1,
    booked: 0,
    metadata: metadata.value,
  });
}

function createAppointmentAudit(
  context: OperationContext,
  appointmentId: string,
  action: AppointmentAuditEvent["action"],
): AppointmentAuditEvent {
  return {
    auditId: `${appointmentId}-${action}`,
    appointmentId,
    tenantId: context.tenantId,
    action,
    actorId: context.actorId,
    occurredAt: context.occurredAt,
    metadata: {},
  };
}

function disabledGoogleAudit(appointment: Appointment): GoogleCalendarSyncAudit {
  return {
    appointmentId: appointment.appointmentId,
    attempted: false,
    status: "not_required",
    errorClass: "disabled",
    metadata: { externalCredentialsUsed: false },
  };
}

function googleAudit(
  appointment: Appointment,
  status: CalendarSyncStatus,
): GoogleCalendarSyncAudit {
  return {
    appointmentId: appointment.appointmentId,
    attempted: true,
    status,
    metadata: { externalCredentialsUsed: false, adapterMode: "in-memory" },
  };
}

function classifySourceType(sourceName: string): KnowledgeDocument["sourceType"] {
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

function chunkKnowledgeText(input: {
  readonly tenantId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly text: string;
}): readonly KnowledgeChunk[] {
  const sanitized = sanitizeKnowledgeText(input.text);
  const chunks: KnowledgeChunk[] = [];
  for (let index = 0; index < sanitized.length; index += 500) {
    const textSanitized = sanitized.slice(index, index + 500).trim();
    if (!textSanitized) continue;
    chunks.push({
      chunkId: `${input.documentId}-chunk-${chunks.length + 1}`,
      documentId: input.documentId,
      versionId: input.versionId,
      tenantId: input.tenantId,
      textSanitized,
      sourceOrdinal: chunks.length,
    });
  }
  return chunks;
}

function sanitizeKnowledgeText(text: string): string {
  return text
    .replace(/[^@\s]+@[^@\s]+\.[^@\s]+/gu, redactedMetadataValue)
    .replace(/\+\d[\d\s().-]{7,}\d/gu, redactedMetadataValue)
    .replace(/\b(?:agent|phnum)_[A-Za-z0-9]{6,}\b/gu, redactedMetadataValue);
}

function tokenize(value: string): readonly string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9áéíóúñ]+/iu)
    .filter((token) => token.length > 2);
}

function scoreChunk(text: string, queryTokens: readonly string[]): number {
  const lower = text.toLowerCase();
  return queryTokens.reduce((score, token) => score + (lower.includes(token) ? 1 : 0), 0);
}

function safeReference(value: string, prefix: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, "-")
    .replace(/-+/gu, "-");
  return normalized.length > 0 ? normalized : `${prefix}-ref`;
}
