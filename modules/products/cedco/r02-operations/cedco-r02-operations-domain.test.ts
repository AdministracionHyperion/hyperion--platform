import { describe, expect, it } from "vitest";

import {
  createOperationContext,
  redactedMetadataValue,
} from "../../../../packages/shared/src/core";
import {
  DisabledEmbeddingAdapter,
  DisabledGoogleCalendarAdapter,
  InMemoryR02AgentRepository,
  InMemoryR02CalendarRepository,
  InMemoryR02KnowledgeBase,
  InMemoryTestGoogleCalendarAdapter,
  cedcoR02Permissions,
  cedcoR02Roles,
  createAvailabilitySlot,
  createCedcoR02FlowSpec,
  runGoogleCalendarSyncJob,
  validateAgentToolPolicy,
} from "./src";

describe("CEDCO R02 operations foundation", () => {
  it("defines R02 roles and least-privilege permissions", () => {
    expect(cedcoR02Permissions).toContain("r02.calendar.write");
    expect(cedcoR02Permissions).toContain("r02.google_calendar.sync");
    expect(cedcoR02Roles.super_admin_hyperion).toHaveLength(cedcoR02Permissions.length);
    expect(cedcoR02Roles.reports_viewer).not.toContain("r02.agents.write");
    expect(cedcoR02Roles.human_handoff_agent).toContain("r02.handoff.write");
  });

  it("creates availability, appointments, reschedule, cancel and audit metadata", () => {
    const context = testContext();
    const repository = new InMemoryR02CalendarRepository();
    const slot = createAvailabilitySlot({
      context,
      slotId: "slot-r02-001",
      resourceId: "doctor-general",
      siteId: "bucaramanga",
      serviceTypeId: "consulta-general",
      startsAt: new Date("2026-07-01T14:00:00.000Z"),
      endsAt: new Date("2026-07-01T14:30:00.000Z"),
      metadata: { phone: "blocked" },
    });

    expect(slot.ok).toBe(true);
    if (!slot.ok) return;
    expect(slot.value.metadata.phone).toBe(redactedMetadataValue);
    expect(repository.addAvailability(slot.value).ok).toBe(true);
    expect(repository.queryAvailability({ tenantId: context.tenantId })).toHaveLength(1);

    const appointment = repository.createAppointment({
      context,
      appointmentId: "appointment-r02-001",
      slotId: "slot-r02-001",
      patientRef: "patient synthetic ref",
    });
    expect(appointment.ok).toBe(true);
    if (!appointment.ok) return;
    expect(appointment.value.status).toBe("scheduled");
    expect(appointment.value.syncStatus).toBe("pending");
    expect(repository.queryAvailability({ tenantId: context.tenantId })).toHaveLength(0);

    const secondSlot = createAvailabilitySlot({
      context,
      slotId: "slot-r02-002",
      resourceId: "doctor-general",
      siteId: "bucaramanga",
      serviceTypeId: "consulta-general",
      startsAt: new Date("2026-07-01T15:00:00.000Z"),
      endsAt: new Date("2026-07-01T15:30:00.000Z"),
    });
    if (!secondSlot.ok) return;
    repository.addAvailability(secondSlot.value);

    const rescheduled = repository.rescheduleAppointment({
      context,
      appointmentId: "appointment-r02-001",
      newSlotId: "slot-r02-002",
    });
    expect(rescheduled.ok && rescheduled.value.status).toBe("rescheduled");

    const cancelled = repository.cancelAppointment({
      context,
      appointmentId: "appointment-r02-001",
    });
    expect(cancelled.ok && cancelled.value.status).toBe("cancelled");
    expect(repository.listAudit(context.tenantId).map((event) => event.action)).toEqual([
      "created",
      "rescheduled",
      "cancelled",
    ]);
  });

  it("keeps Google Calendar disabled by default and testable in memory", async () => {
    const context = testContext();
    const repository = new InMemoryR02CalendarRepository();
    const slot = createAvailabilitySlot({
      context,
      slotId: "slot-r02-sync",
      resourceId: "doctor-general",
      siteId: "bucaramanga",
      serviceTypeId: "consulta-general",
      startsAt: new Date("2026-07-02T14:00:00.000Z"),
      endsAt: new Date("2026-07-02T14:30:00.000Z"),
    });
    if (!slot.ok) return;
    repository.addAvailability(slot.value);
    const appointment = repository.createAppointment({
      context,
      appointmentId: "appointment-r02-sync",
      slotId: "slot-r02-sync",
      patientRef: "patient-ref",
    });
    if (!appointment.ok) return;

    const disabled = await runGoogleCalendarSyncJob({
      appointment: appointment.value,
      adapter: new DisabledGoogleCalendarAdapter(),
      operation: "create",
    });
    expect(disabled.ok && disabled.value.attempted).toBe(false);
    expect(disabled.ok && disabled.value.errorClass).toBe("disabled");

    const inMemory = new InMemoryTestGoogleCalendarAdapter();
    const synced = await runGoogleCalendarSyncJob({
      appointment: appointment.value,
      adapter: inMemory,
      operation: "create",
    });
    expect(synced.ok && synced.value.status).toBe("synced");
    expect(inMemory.events.has("appointment-r02-sync")).toBe(true);
  });

  it("ingests, chunks, approves and retrieves sanitized knowledge without external embeddings", async () => {
    const context = testContext();
    const knowledge = new InMemoryR02KnowledgeBase();
    const uploaded = knowledge.uploadDocument({
      context,
      documentId: "kb-r02-general",
      sourceName: "cedco-r02.md",
      contentText:
        "CEDCO agenda citas de consulta general en Bucaramanga. Contacto +573001112233 agent_ABC123456.",
      sizeBytes: 120,
    });

    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;
    expect(uploaded.value.status).toBe("ready_for_review");
    expect(uploaded.value.chunks[0]?.textSanitized).not.toContain("+573001112233");
    expect(uploaded.value.chunks[0]?.textSanitized).not.toContain("agent_ABC123456");

    expect(knowledge.approveDocument(context, "kb-r02-general").ok).toBe(true);
    expect(knowledge.activateDocument(context, "kb-r02-general").ok).toBe(true);
    expect(knowledge.getActiveVersionId()).toBe("kb-r02-general-v1");
    expect(
      knowledge.retrieve({ tenantId: context.tenantId, query: "citas Bucaramanga" }),
    ).toHaveLength(1);

    const embedding = await new DisabledEmbeddingAdapter().embed();
    expect(embedding.ok).toBe(false);
  });

  it("accepts operator-supplied text extracted from PDF sources", () => {
    const context = testContext();
    const knowledge = new InMemoryR02KnowledgeBase();
    const uploaded = knowledge.uploadDocument({
      context,
      documentId: "doc-r02-domain-pdf-text",
      sourceName: "cedco-r02-domain.pdf",
      contentText: "Texto pre extraido para programacion de cita CEDCO.",
      sizeBytes: 128,
      metadata: { source: "domain-test" },
    });

    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;
    expect(uploaded.value.sourceType).toBe("pdf");
    expect(uploaded.value.metadata).toMatchObject({
      binaryStored: false,
      externalEmbeddingsUsed: false,
      externalExtractorUsed: false,
      extractionMode: "operator_supplied_text",
      originalSourceType: "pdf",
    });
    expect(uploaded.value.chunks.length).toBeGreaterThan(0);
  });

  it("creates and activates the initial CEDCO R02 agent without provider mutation", () => {
    const context = testContext();
    const repository = new InMemoryR02AgentRepository();
    const version = repository.createInitialAgent(context);

    expect(version.ok).toBe(true);
    if (!version.ok) return;
    expect(version.value.providerMutationAllowed).toBe(false);
    expect(version.value.allowedTools).toContain("answer_from_knowledge");
    expect(version.value.allowedTools).toContain("create_appointment");
    expect(version.value.prohibitedTools).toContain("access_transcript_audio_without_approval");
    expect(validateAgentToolPolicy(version.value).ok).toBe(true);

    const approved = repository.approveVersion(context, version.value.versionId);
    expect(approved.ok && approved.value.status).toBe("approved");
    const active = repository.activateVersion(context, version.value.versionId);
    expect(active.ok && active.value.status).toBe("active");
    expect(repository.getAgent("cedco-r02-recepcion-agendamiento")?.activeVersionId).toBe(
      "cedco-r02-recepcion-v1",
    );
  });

  it("documents the R02 call flow with disabled recording, transcript/audio and provider mutation", () => {
    const flow = createCedcoR02FlowSpec();

    expect(flow.stages).toContain("saludo");
    expect(flow.stages).toContain("agendamiento");
    expect(flow.handoffTargets).toContain("pbx");
    expect(flow.recordingEnabled).toBe(false);
    expect(flow.transcriptAudioEnabled).toBe(false);
    expect(flow.providerMutationAllowed).toBe(false);
  });
});

function testContext() {
  const context = createOperationContext({
    tenantId: "cedco-r02-test",
    actorId: "operator-r02",
    correlationId: "corr-r02-test",
    source: "unit-test",
    occurredAt: new Date("2026-07-01T00:00:00.000Z"),
  });
  if (!context.ok) {
    throw new Error("invalid test context");
  }
  return context.value;
}
