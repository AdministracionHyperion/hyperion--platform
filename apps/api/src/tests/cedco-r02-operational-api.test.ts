import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";

interface Envelope<T = unknown> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
}

let app: FastifyInstance;

const baseUrl = "/api/v1/tenants/cedco-r02-test/r02";
const adminHeaders = {
  "x-actor-id": "r02-admin",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-r02-operational",
};
const viewerHeaders = {
  "x-actor-id": "r02-viewer",
  "x-actor-roles": "tenant-viewer",
  "x-correlation-id": "corr-r02-viewer",
};

beforeEach(async () => {
  app = await createApiApp({ services: createFakeApiServices() });
});

afterEach(async () => {
  await app.close();
});

describe("CEDCO R02 operational API", () => {
  it("serves the R02 dashboard route without external provider fields", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${baseUrl}/dashboard`,
      headers: adminHeaders,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("CEDCO R02 Operations");
    expect(response.body).toContain("Cargar RAG");
    expect(response.body).toContain('data-r02-action="handoff-target"');
    expect(response.body).toContain("cedco-r02-test");
    expect(response.body).not.toMatch(
      /api[_-]?key|phone_number_id|agent_id|audio_url|raw_transcript/iu,
    );
  });

  it("creates availability, books, reschedules, cancels and audits an appointment", async () => {
    const firstSlot = await createAvailability("slot-r02-api-001", "2026-07-03T14:00:00.000Z");
    const secondSlot = await createAvailability("slot-r02-api-002", "2026-07-03T15:00:00.000Z");
    expect(firstSlot.statusCode).toBe(201);
    expect(secondSlot.statusCode).toBe(201);

    const availability = await app.inject({
      method: "GET",
      url: `${baseUrl}/calendar/availability?serviceTypeId=consulta-general`,
      headers: adminHeaders,
    });
    expect(availability.json<Envelope<unknown[]>>().data).toHaveLength(2);

    const appointment = await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments`,
      headers: adminHeaders,
      payload: {
        appointmentId: "appointment-r02-api-001",
        slotId: "slot-r02-api-001",
        patientRef: "patient-ref-001",
        metadata: { source: "api-test" },
      },
    });
    expect(appointment.statusCode).toBe(201);
    expect(appointment.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      status: "scheduled",
      syncStatus: "pending",
    });

    const sync = await app.inject({
      method: "POST",
      url: `${baseUrl}/google-calendar/appointment-r02-api-001/sync-test`,
      headers: adminHeaders,
    });
    expect(sync.statusCode).toBe(200);
    expect(sync.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      attempted: false,
      errorClass: "disabled",
    });

    const rescheduled = await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments/appointment-r02-api-001/reschedule`,
      headers: adminHeaders,
      payload: { newSlotId: "slot-r02-api-002" },
    });
    expect(rescheduled.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      status: "rescheduled",
    });

    const cancelled = await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments/appointment-r02-api-001/cancel`,
      headers: adminHeaders,
    });
    expect(cancelled.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      status: "cancelled",
    });

    const audit = await app.inject({
      method: "GET",
      url: `${baseUrl}/audit`,
      headers: adminHeaders,
    });
    expect(audit.statusCode).toBe(200);
    expect(JSON.stringify(audit.json<Envelope>())).not.toMatch(
      /rawTranscript|audioUrl|phoneNumber/iu,
    );
  });

  it("uploads, processes, approves, activates and searches RAG content without embeddings", async () => {
    const base = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-bases`,
      headers: adminHeaders,
      payload: { knowledgeBaseId: "kb-r02-api", name: "CEDCO R02" },
    });
    expect(base.statusCode).toBe(201);

    const upload = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-documents/upload`,
      headers: adminHeaders,
      payload: {
        documentId: "doc-r02-api",
        sourceName: "cedco-r02.md",
        contentText: "CEDCO agenda consulta general en sede principal. Ref seguro patient-ref-001.",
        metadata: { source: "api-test" },
      },
    });
    expect(upload.statusCode).toBe(201);

    for (const action of ["process", "approve", "activate"] as const) {
      const response = await app.inject({
        method: "POST",
        url: `${baseUrl}/knowledge-documents/doc-r02-api/${action}`,
        headers: adminHeaders,
      });
      expect(response.statusCode).toBe(200);
    }

    const search = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge/search-test`,
      headers: adminHeaders,
      payload: { queryText: "consulta general sede", limit: 3 },
    });
    const body = search.json<Envelope<unknown[]>>();
    expect(search.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);

    const documents = await app.inject({
      method: "GET",
      url: `${baseUrl}/knowledge-documents`,
      headers: adminHeaders,
    });
    expect(documents.json<Envelope<unknown[]>>().data?.[0]).toMatchObject({
      documentId: "doc-r02-api",
      versionId: "doc-r02-api-v1",
    });
  });

  it("creates and activates an agent version and simulates a scheduling flow", async () => {
    await createAvailability("slot-r02-flow-001", "2026-07-04T14:00:00.000Z");
    const agent = await app.inject({
      method: "POST",
      url: `${baseUrl}/agents`,
      headers: adminHeaders,
      payload: { seedDemo: true },
    });
    expect(agent.statusCode).toBe(201);

    const version = await app.inject({
      method: "POST",
      url: `${baseUrl}/agents/cedco-r02-recepcion-agendamiento/versions`,
      headers: adminHeaders,
      payload: {
        versionId: "cedco-r02-recepcion-api-v2",
        greeting: "Hola, gracias por comunicarte con CEDCO.",
        prompt: "Consulta conocimiento aprobado y disponibilidad antes de crear una cita interna.",
      },
    });
    expect(version.statusCode).toBe(201);

    const approved = await app.inject({
      method: "POST",
      url: `${baseUrl}/agents/cedco-r02-recepcion-api-v2/approve`,
      headers: adminHeaders,
    });
    expect(approved.statusCode).toBe(200);

    const active = await app.inject({
      method: "POST",
      url: `${baseUrl}/agents/cedco-r02-recepcion-api-v2/activate`,
      headers: adminHeaders,
    });
    expect(active.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      status: "active",
    });

    const simulation = await app.inject({
      method: "POST",
      url: `${baseUrl}/agent-flow/simulate`,
      headers: adminHeaders,
      payload: {
        simulationId: "sim-r02-api-001",
        intent: "schedule",
        queryText: "quiero una cita",
        slotId: "slot-r02-flow-001",
        appointmentId: "appointment-r02-flow-001",
        patientRef: "patient-ref-002",
      },
    });
    expect(simulation.statusCode).toBe(200);
    expect(simulation.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      appointmentCreated: true,
      googleSyncStatus: "pending",
      externalProvidersUsed: false,
      transcriptAudioAccessed: false,
    });

    const agents = await app.inject({
      method: "GET",
      url: `${baseUrl}/agents`,
      headers: adminHeaders,
    });
    expect(agents.json<Envelope<unknown[]>>().data?.[0]).toMatchObject({
      agentId: "cedco-r02-recepcion-agendamiento",
    });
  });

  it("stores handoff targets as internal refs without provider mutation", async () => {
    const response = await app.inject({
      method: "POST",
      url: `${baseUrl}/handoff-targets`,
      headers: adminHeaders,
      payload: {
        targetId: "handoff-dashboard",
        targetType: "human",
        displayName: "Recepcion humana CEDCO",
        routeRef: "human_queue_dashboard",
        status: "active",
        metadata: { source: "api-test" },
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json<Envelope<Record<string, unknown>>>().data).toMatchObject({
      targetId: "handoff-dashboard",
      realProviderMutation: false,
    });

    const targets = await app.inject({
      method: "GET",
      url: `${baseUrl}/handoff-targets`,
      headers: adminHeaders,
    });
    expect(targets.json<Envelope<unknown[]>>().data).toHaveLength(1);
  });

  it("denies write routes to viewer roles and blocks sensitive payload fields", async () => {
    const denied = await app.inject({
      method: "POST",
      url: `${baseUrl}/calendar/availability`,
      headers: viewerHeaders,
      payload: {
        slotId: "slot-r02-denied",
        resourceId: "resource-r02",
        siteId: "cedco-main-site",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-05T14:00:00.000Z",
        endsAt: "2026-07-05T14:30:00.000Z",
      },
    });
    expect(denied.statusCode).toBe(403);

    const unsafe = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-documents/upload`,
      headers: adminHeaders,
      payload: {
        documentId: "doc-r02-unsafe",
        sourceName: "cedco-r02.md",
        contentText: "unsafe",
        metadata: { token: "blocked" },
      },
    });
    expect(unsafe.statusCode).toBe(400);
  });

  it("preserves tenant isolation across appointment lists", async () => {
    await createAvailability("slot-r02-tenant-a", "2026-07-06T14:00:00.000Z");
    await app.inject({
      method: "POST",
      url: `${baseUrl}/appointments`,
      headers: adminHeaders,
      payload: {
        appointmentId: "appointment-r02-tenant-a",
        slotId: "slot-r02-tenant-a",
        patientRef: "patient-ref-a",
      },
    });

    const otherTenant = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-r02-other/r02/appointments",
      headers: adminHeaders,
    });
    expect(otherTenant.json<Envelope<unknown[]>>().data).toHaveLength(0);
  });
});

async function createAvailability(slotId: string, startsAt: string) {
  return app.inject({
    method: "POST",
    url: `${baseUrl}/calendar/availability`,
    headers: adminHeaders,
    payload: {
      slotId,
      resourceId: "cedco-r02-recepcion",
      siteId: "cedco-main-site",
      serviceTypeId: "consulta-general",
      startsAt,
      endsAt: new Date(new Date(startsAt).getTime() + 30 * 60 * 1000).toISOString(),
      capacity: 1,
      metadata: { source: "api-test" },
    },
  });
}
