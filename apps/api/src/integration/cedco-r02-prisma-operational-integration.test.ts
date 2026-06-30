import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
}

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const baseUrl = "/api/v1/tenants/cedco-test/r02";
const otherTenantUrl = "/api/v1/tenants/other-tenant/r02";
const adminHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-r02-prisma-test",
};
const viewerHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-viewer",
  "x-correlation-id": "corr-r02-prisma-viewer",
};

let harness: ApiPrismaTestHarness;
let app: FastifyInstance;

runWhenDatabaseExists("CEDCO R02 Prisma-backed operational surface", () => {
  beforeAll(async () => {
    harness = await createApiPrismaTestHarness(databaseUrl as string);
    app = harness.app;
  }, 120_000);

  beforeEach(async () => {
    await harness.cleanup();
    await harness.seedBaseContext();
  });

  afterAll(async () => {
    await harness.disconnect();
  });

  it("seeds idempotent demo records into CedcoR02 tables", async () => {
    const first = await seedDemo();
    const second = await seedDemo();

    expect(first.statusCode).toBe(200);
    expect(second.json<Envelope>().data).toMatchObject({
      seeded: true,
      idempotent: true,
      storageMode: "prisma",
      externalProvidersUsed: false,
      transcriptAudioAccessed: false,
    });
    await expectR02Counts({ resources: 1, serviceTypes: 1, voiceAgents: 1, handoffTargets: 1 });
  });

  it("persists appointment lifecycle reads and audit trail through Prisma", async () => {
    await seedDemo();
    await createAvailability("slot-r02-prisma-a", "2026-07-09T14:00:00.000Z");
    await createAvailability("slot-r02-prisma-b", "2026-07-09T15:00:00.000Z");

    const created = await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments`,
      headers: adminHeaders,
      payload: {
        appointmentId: "appointment-r02-prisma",
        slotId: "slot-r02-prisma-a",
        patientRef: "patient-ref-prisma",
      },
    });
    expect(created.statusCode).toBe(201);
    expect(await readAppointmentStatus("appointment-r02-prisma")).toBe("scheduled");

    const sync = await app.inject({
      method: "POST",
      url: `${baseUrl}/google-calendar/appointment-r02-prisma/sync-test`,
      headers: adminHeaders,
    });
    expect(sync.json<Envelope>().data).toMatchObject({ attempted: false, errorClass: "disabled" });
    expect(await harness.prisma.cedcoR02CalendarSyncState.count()).toBe(1);

    const dryRun = await app.inject({
      method: "POST",
      url: `${baseUrl}/google-calendar/appointment-r02-prisma/sync-dry-run`,
      headers: adminHeaders,
    });
    expect(dryRun.json<Envelope>().data).toMatchObject({
      attempted: false,
      adapterMode: "disabled-google-calendar",
      plannedOperation: "create_event",
      externalRequestMade: false,
      realCredentialsUsed: false,
      providerMutation: false,
    });
    expect(await harness.prisma.cedcoR02CalendarSyncState.count()).toBe(1);
    await expect(
      harness.prisma.cedcoR02AuditEvent.findFirst({
        where: { tenantId: "cedco-test", action: "calendar_sync_dry_run" },
      }),
    ).resolves.toBeTruthy();

    await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments/appointment-r02-prisma/reschedule`,
      headers: adminHeaders,
      payload: { newSlotId: "slot-r02-prisma-b" },
    });
    expect(await readAppointmentStatus("appointment-r02-prisma")).toBe("rescheduled");

    await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments/appointment-r02-prisma/cancel`,
      headers: adminHeaders,
    });
    expect(await readAppointmentStatus("appointment-r02-prisma")).toBe("cancelled");

    const audit = await app.inject({
      method: "GET",
      url: `${baseUrl}/audit`,
      headers: adminHeaders,
    });
    expect(audit.statusCode).toBe(200);
    expect(audit.json<Envelope<unknown[]>>().data?.length).toBeGreaterThan(0);
  });

  it("persists RAG chunks, source versions, agent versions and flow simulation", async () => {
    await seedDemo();
    await createAvailability("slot-r02-prisma-flow", "2026-07-10T14:00:00.000Z");

    const kb = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-bases`,
      headers: adminHeaders,
      payload: { knowledgeBaseId: "kb-r02-prisma", name: "CEDCO R02 Prisma" },
    });
    expect(kb.statusCode).toBe(201);

    await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-documents/upload`,
      headers: adminHeaders,
      payload: {
        documentId: "doc-r02-prisma",
        sourceName: "cedco-r02-prisma.md",
        contentText: "CEDCO agenda interna consulta general y programacion de cita.",
      },
    });
    for (const action of ["process", "approve", "activate"] as const) {
      const response = await app.inject({
        method: "POST",
        url: `${baseUrl}/knowledge-documents/doc-r02-prisma/${action}`,
        headers: adminHeaders,
      });
      expect(response.statusCode).toBe(200);
    }

    const search = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge/search-test`,
      headers: adminHeaders,
      payload: { queryText: "agenda consulta", limit: 2 },
    });
    expect(search.json<Envelope<unknown[]>>().data?.[0]).toMatchObject({
      documentId: "doc-r02-prisma",
      versionId: "doc-r02-prisma-v1",
    });

    const pdfTextUpload = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-documents/upload`,
      headers: adminHeaders,
      payload: {
        documentId: "doc-r02-prisma-pdf-text",
        sourceName: "cedco-r02-prisma.pdf",
        contentText: "Texto pre extraido del documento CEDCO para orientacion inicial.",
      },
    });
    expect(pdfTextUpload.statusCode).toBe(201);
    expect(
      pdfTextUpload.json<Envelope<{ metadata: Record<string, unknown> }>>().data,
    ).toMatchObject({
      metadata: {
        binaryStored: false,
        externalEmbeddingsUsed: false,
        externalExtractorUsed: false,
        extractionMode: "operator_supplied_text",
        originalSourceType: "pdf",
      },
    });

    await app.inject({
      method: "POST",
      url: `${baseUrl}/agents/cedco-r02-recepcion-agendamiento/versions`,
      headers: adminHeaders,
      payload: {
        versionId: "cedco-r02-prisma-v2",
        greeting: "Hola, gracias por comunicarte con CEDCO.",
        prompt: "Consulta conocimiento y disponibilidad antes de confirmar.",
      },
    });
    await app.inject({
      method: "POST",
      url: `${baseUrl}/agents/cedco-r02-prisma-v2/approve`,
      headers: adminHeaders,
    });
    const active = await app.inject({
      method: "POST",
      url: `${baseUrl}/agents/cedco-r02-prisma-v2/activate`,
      headers: adminHeaders,
    });
    expect(active.json<Envelope>().data).toMatchObject({ status: "active" });

    const simulation = await app.inject({
      method: "POST",
      url: `${baseUrl}/agent-flow/simulate`,
      headers: adminHeaders,
      payload: {
        simulationId: "sim-r02-prisma",
        intent: "schedule",
        queryText: "programar cita consulta",
        slotId: "slot-r02-prisma-flow",
        appointmentId: "appointment-r02-prisma-flow",
        patientRef: "patient-ref-flow",
      },
    });
    expect(simulation.json<Envelope>().data).toMatchObject({
      appointmentCreated: true,
      externalProvidersUsed: false,
      transcriptAudioAccessed: false,
    });

    const handoff = await app.inject({
      method: "POST",
      url: `${baseUrl}/agent-flow/simulate`,
      headers: adminHeaders,
      payload: {
        simulationId: "sim-r02-prisma-handoff",
        intent: "handoff",
        queryText: "necesito asesor humano",
      },
    });
    expect(handoff.json<Envelope>().data).toMatchObject({ handoffCreated: true });

    const readiness = await app.inject({
      method: "GET",
      url: `${baseUrl}/readiness`,
      headers: adminHeaders,
    });
    expect(readiness.statusCode).toBe(200);
    expect(
      readiness.json<Envelope<{ counts: Record<string, number>; providerEgressEnabled: boolean }>>()
        .data,
    ).toMatchObject({
      counts: {
        activeKnowledgeDocuments: 1,
        activeAgents: 1,
        activeHandoffTargets: 1,
      },
      providerEgressEnabled: false,
    });
  });

  it("keeps RBAC and tenant isolation on persisted R02 records", async () => {
    await seedDemo();
    await createAvailability("slot-r02-isolation", "2026-07-11T14:00:00.000Z");
    await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments`,
      headers: adminHeaders,
      payload: {
        appointmentId: "appointment-r02-isolation",
        slotId: "slot-r02-isolation",
        patientRef: "patient-ref-isolation",
      },
    });

    const denied = await app.inject({
      method: "POST",
      url: `${baseUrl}/calendar/availability`,
      headers: viewerHeaders,
      payload: {
        slotId: "slot-r02-denied",
        resourceId: "cedco-r02-recepcion",
        siteId: "cedco-main-site",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-11T15:00:00.000Z",
        endsAt: "2026-07-11T15:30:00.000Z",
      },
    });
    expect(denied.statusCode).toBe(403);

    const otherTenant = await app.inject({
      method: "GET",
      url: `${otherTenantUrl}/appointments`,
      headers: adminHeaders,
    });
    expect(otherTenant.json<Envelope<unknown[]>>().data).toHaveLength(0);
  });

  it("does not let another tenant overwrite an existing handoff target", async () => {
    await seedDemo();
    const created = await app.inject({
      method: "POST",
      url: `${baseUrl}/handoff-targets`,
      headers: adminHeaders,
      payload: {
        targetId: "handoff-prisma-isolation",
        targetType: "human",
        displayName: "Recepcion humana CEDCO",
        routeRef: "human_queue_isolation",
        status: "active",
      },
    });
    expect(created.statusCode).toBe(201);

    const takeover = await app.inject({
      method: "POST",
      url: `${otherTenantUrl}/handoff-targets`,
      headers: adminHeaders,
      payload: {
        targetId: "handoff-prisma-isolation",
        targetType: "pbx",
        displayName: "Other tenant target",
        routeRef: "other_queue",
        status: "active",
      },
    });
    expect(takeover.statusCode).toBe(409);

    const row = await harness.prisma.cedcoR02HandoffTarget.findUnique({
      where: { id: "handoff-prisma-isolation" },
    });
    expect(row).toMatchObject({ tenantId: "cedco-test", targetType: "human" });
  });
});

async function seedDemo() {
  return app.inject({ method: "POST", url: `${baseUrl}/demo/seed`, headers: adminHeaders });
}

async function createAvailability(slotId: string, startsAt: string) {
  const start = new Date(startsAt);
  return app.inject({
    method: "POST",
    url: `${baseUrl}/calendar/availability`,
    headers: adminHeaders,
    payload: {
      slotId,
      resourceId: "cedco-r02-recepcion",
      siteId: "cedco-main-site",
      serviceTypeId: "consulta-general",
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
      capacity: 1,
    },
  });
}

async function readAppointmentStatus(appointmentId: string): Promise<string | undefined> {
  const response = await app.inject({
    method: "GET",
    url: `${baseUrl}/appointments`,
    headers: adminHeaders,
  });
  return response
    .json<Envelope<Array<{ appointmentId: string; status: string }>>>()
    .data?.find((item) => item.appointmentId === appointmentId)?.status;
}

async function expectR02Counts(expected: {
  readonly resources: number;
  readonly serviceTypes: number;
  readonly voiceAgents: number;
  readonly handoffTargets: number;
}) {
  await expect(harness.prisma.cedcoR02CalendarResource.count()).resolves.toBe(expected.resources);
  await expect(harness.prisma.cedcoR02ServiceType.count()).resolves.toBe(expected.serviceTypes);
  await expect(harness.prisma.cedcoR02VoiceAgent.count()).resolves.toBe(expected.voiceAgents);
  await expect(harness.prisma.cedcoR02HandoffTarget.count()).resolves.toBe(expected.handoffTargets);
}
