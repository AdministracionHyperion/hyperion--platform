import { readFileSync } from "node:fs";
import type { FastifyInstance } from "fastify";
import type { Permission } from "../../../../modules/core/identity-access/src/permission";
import { rolesAllow } from "../../../../modules/core/identity-access/src/rbac-policy";
import type { Role } from "../../../../modules/core/identity-access/src/role";
import {
  createR02OperationalDemoModel,
  renderR02OperationalPage,
  type R02OperationalPanelModel,
} from "../../../web/src/dashboard/r02-operational-page";
import {
  availabilityQuerySchema,
  cedcoR02IdParamsSchema,
  cedcoR02ParamsSchema,
  createAgentBodyR02Schema,
  createAgentVersionBodyR02Schema,
  createAppointmentBodySchema,
  createAvailabilityBodySchema,
  createKnowledgeBaseBodySchema,
  rescheduleAppointmentBodySchema,
  searchKnowledgeBodySchema,
  simulateAgentFlowBodySchema,
  upsertHandoffTargetBodySchema,
  uploadKnowledgeDocumentBodySchema,
} from "../contracts";
import { ok } from "../http/api-response";
import { getRequiredRequestContext } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

const r02OperationalStylesheet = readFileSync(
  new URL("../../../web/src/dashboard/styles/operational-dashboard.css", import.meta.url),
  "utf8",
);

export async function registerCedcoR02Routes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get(
    "/api/v1/tenants/:tenantId/r02/styles/operational-dashboard.css",
    async (request, reply) => {
      validateWithSchema(cedcoR02ParamsSchema, request.params);
      getRequiredRequestContext(request, ["tenant:read"]);
      reply.type("text/css; charset=utf-8");
      return r02OperationalStylesheet;
    },
  );

  app.get("/api/v1/tenants/:tenantId/r02/dashboard", async (request, reply) => {
    const params = validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, [
      "tenant:read",
      "agent:read",
      "voice:call:read",
    ]);
    const access = buildR02DashboardAccess(context.roles);
    const [appointments, availability, audit] = await Promise.all([
      access.canViewCalendar ? dependencies.services.cedcoR02.listAppointments(context) : [],
      access.canViewCalendar ? dependencies.services.cedcoR02.listAvailability(context, {}) : [],
      access.canReadAudit ? dependencies.services.cedcoR02.listAudit(context) : [],
    ]);
    const [knowledgeDocuments, agents, handoffTargets] = await Promise.all([
      access.canViewKnowledge ? dependencies.services.cedcoR02.listKnowledgeDocuments(context) : [],
      access.canViewAgents ? dependencies.services.cedcoR02.listAgents(context) : [],
      access.canViewHandoff ? dependencies.services.cedcoR02.listHandoffTargets(context) : [],
    ]);
    const baseModel = createR02OperationalDemoModel();
    const dashboardAppointments = toDashboardAppointments(appointments);
    const dashboardAvailability = toDashboardAvailability(availability);
    const dashboardKnowledgeDocuments = toDashboardKnowledgeDocuments(knowledgeDocuments);
    const dashboardAgents = toDashboardAgents(agents);
    const dashboardHandoffTargets = toDashboardHandoffTargets(handoffTargets);
    const readiness = buildR02Readiness({
      appointments: dashboardAppointments,
      availability: dashboardAvailability,
      knowledgeDocuments: dashboardKnowledgeDocuments,
      agents: dashboardAgents,
      handoffTargets: dashboardHandoffTargets,
      auditCount: Array.isArray(audit) ? audit.length : baseModel.auditCount,
    });
    const html = renderR02OperationalPage({
      ...baseModel,
      tenantId: params.tenantId,
      workspaceName: "CEDCO",
      viewer: {
        actorId: context.actorId,
        roleLabel: roleLabel(context.roles),
      },
      capabilities: access,
      appointments: dashboardAppointments,
      availability: dashboardAvailability,
      knowledgeDocuments: dashboardKnowledgeDocuments,
      agents: dashboardAgents,
      handoffTargets: dashboardHandoffTargets,
      overallStatus: readiness.overallStatus,
      readinessItems: readiness.readinessItems,
      finalOperatorInputs: readiness.finalOperatorInputs,
      futureGates: readiness.futureGates,
      integrationStatus: readiness.integrationStatus,
      auditCount: readiness.auditCount,
      auditRestricted: !access.canReadAudit,
    });
    reply.type("text/html; charset=utf-8");
    return html;
  });

  app.get("/api/v1/tenants/:tenantId/r02/readiness", async (request) => {
    const params = validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, [
      "tenant:read",
      "agent:read",
      "voice:call:read",
    ]);
    const [appointments, availability, audit] = await Promise.all([
      dependencies.services.cedcoR02.listAppointments(context),
      dependencies.services.cedcoR02.listAvailability(context, {}),
      dependencies.services.cedcoR02.listAudit(context),
    ]);
    const [knowledgeDocuments, agents, handoffTargets] = await Promise.all([
      dependencies.services.cedcoR02.listKnowledgeDocuments(context),
      dependencies.services.cedcoR02.listAgents(context),
      dependencies.services.cedcoR02.listHandoffTargets(context),
    ]);

    return ok(
      {
        tenantId: params.tenantId,
        ...buildR02Readiness({
          appointments: toDashboardAppointments(appointments),
          availability: toDashboardAvailability(availability),
          knowledgeDocuments: toDashboardKnowledgeDocuments(knowledgeDocuments),
          agents: toDashboardAgents(agents),
          handoffTargets: toDashboardHandoffTargets(handoffTargets),
          auditCount: Array.isArray(audit) ? audit.length : 0,
        }),
      },
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/demo/seed", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(await dependencies.services.cedcoR02.seedDemo(context), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/calendar/availability", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const query = validateWithSchema(availabilityQuerySchema, request.query);
    const context = getRequiredRequestContext(request, ["tenant:read", "voice:call:read"]);
    return ok(await dependencies.services.cedcoR02.listAvailability(context, query), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/calendar/availability", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createAvailabilityBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createAvailability(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/appointments", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "voice:call:read"]);
    return ok(await dependencies.services.cedcoR02.listAppointments(context), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/appointments", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createAppointmentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createAppointment(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/appointments/:id/cancel", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(await dependencies.services.cedcoR02.cancelAppointment(context, params.id), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/appointments/:id/reschedule", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const body = validateWithSchema(rescheduleAppointmentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.rescheduleAppointment(context, params.id, body),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/google-calendar/:id/sync-test", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.runCalendarSyncTest(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/google-calendar/:id/sync-dry-run", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.runCalendarSyncDryRun(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/external-calendar/:id/sync-test", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.runCalendarSyncTest(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/external-calendar/:id/sync-dry-run", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(
      await dependencies.services.cedcoR02.runCalendarSyncDryRun(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-bases", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createKnowledgeBaseBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createKnowledgeBase(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/knowledge-bases", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    return ok(await dependencies.services.cedcoR02.listKnowledgeBases(context), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/upload", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(uploadKnowledgeDocumentBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.uploadKnowledgeDocument(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/knowledge-documents", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    return ok(await dependencies.services.cedcoR02.listKnowledgeDocuments(context), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/:id/process", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(
      await dependencies.services.cedcoR02.processKnowledgeDocument(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/:id/approve", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["version:activate"]);
    return ok(
      await dependencies.services.cedcoR02.approveKnowledgeDocument(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge-documents/:id/activate", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    return ok(
      await dependencies.services.cedcoR02.activateKnowledgeDocument(context, params.id),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/knowledge/search-test", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(searchKnowledgeBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    return ok(await dependencies.services.cedcoR02.searchKnowledge(context, body), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(createAgentBodyR02Schema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.createAgent(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/agents", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    return ok(await dependencies.services.cedcoR02.listAgents(context), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents/:id/versions", async (request, reply) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const body = validateWithSchema(createAgentVersionBodyR02Schema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(
      await dependencies.services.cedcoR02.createAgentVersion(context, params.id, body),
      context,
    );
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents/:id/approve", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "version:activate"]);
    return ok(await dependencies.services.cedcoR02.approveAgent(context, params.id), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agents/:id/activate", async (request) => {
    const params = validateWithSchema(cedcoR02IdParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:update", "version:activate"]);
    return ok(await dependencies.services.cedcoR02.activateAgent(context, params.id), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/agent-flow/simulate", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(simulateAgentFlowBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "voice:call:write"]);
    return ok(await dependencies.services.cedcoR02.simulateAgentFlow(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/handoff-targets", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "agent:read"]);
    return ok(await dependencies.services.cedcoR02.listHandoffTargets(context), context);
  });

  app.post("/api/v1/tenants/:tenantId/r02/handoff-targets", async (request, reply) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const body = validateWithSchema(upsertHandoffTargetBodySchema, request.body);
    const context = getRequiredRequestContext(request, ["tenant:update", "agent:write"]);
    reply.code(201);
    return ok(await dependencies.services.cedcoR02.upsertHandoffTarget(context, body), context);
  });

  app.get("/api/v1/tenants/:tenantId/r02/audit", async (request) => {
    validateWithSchema(cedcoR02ParamsSchema, request.params);
    const context = getRequiredRequestContext(request, ["tenant:read", "audit:read"]);
    return ok(await dependencies.services.cedcoR02.listAudit(context), context);
  });
}

function buildR02DashboardAccess(roles: readonly Role[]): R02OperationalPanelModel["capabilities"] {
  const can = (permission: Permission) => rolesAllow(roles, permission);
  const canManageOperationalData = can("tenant:update") || can("voice:call:write");
  const canManageAgentData = can("agent:write") || can("version:write");
  const canApprove = can("version:activate");
  return {
    canViewCalendar: can("tenant:read") || can("voice:call:read"),
    canManageCalendar: canManageOperationalData,
    canViewKnowledge: can("agent:read") || can("tenant:read"),
    canManageKnowledge: canManageAgentData || can("tenant:update"),
    canApproveKnowledge: canApprove,
    canViewAgents: can("agent:read") || can("tenant:read"),
    canManageAgents: canManageAgentData,
    canApproveAgents: canApprove,
    canSimulateFlow: can("voice:call:write") || can("tenant:update"),
    canViewHandoff: can("voice:handoff:manage") || can("agent:read") || can("tenant:read"),
    canManageHandoff: can("voice:handoff:manage") || can("agent:write"),
    canViewIntegrations: can("audit:read") || can("tenant:read"),
    canSyncCalendar: canManageOperationalData,
    canReadAudit: can("audit:read"),
  };
}

function roleLabel(roles: readonly string[]): string {
  const role = roles[0] ?? "reports_viewer";
  const labels: Record<string, string> = {
    super_admin_hyperion: "Super administracion",
    "super-admin": "Super administracion",
    "tenant-admin": "Administracion",
    cedco_admin: "Administracion CEDCO",
    r02_operator: "Operacion",
    compliance_auditor: "Cumplimiento",
    reports_viewer: "Consulta y reportes",
    integration_admin: "Integraciones",
    human_handoff_agent: "Derivaciones humanas",
    auditor: "Auditoria",
    "tenant-viewer": "Consulta",
    "voice-manager": "Gestion de voz",
    "voice-operator": "Operacion de voz",
  };
  return labels[role] ?? "Consulta";
}

function toDashboardAppointments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 8).map((item) => {
    const record = asRecord(item);
    return {
      appointmentId: String(record.appointmentId ?? "appointment-ref"),
      status: String(record.status ?? "unknown"),
      syncStatus: String(record.syncStatus ?? "unknown"),
      serviceTypeId: String(record.serviceTypeId ?? "service-ref"),
      startsAt: toIsoString(record.startsAt),
    };
  });
}

function toDashboardAvailability(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 8).map((item) => {
    const record = asRecord(item);
    const capacity = Number(record.capacity ?? 0);
    const booked = Number(record.booked ?? 0);
    return {
      slotId: String(record.slotId ?? "slot-ref"),
      serviceTypeId: String(record.serviceTypeId ?? "service-ref"),
      startsAt: toIsoString(record.startsAt),
      capacityRemaining: Math.max(0, capacity - booked),
    };
  });
}

function toDashboardKnowledgeDocuments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 12).map((item) => {
    const record = asRecord(item);
    return {
      documentId: String(record.documentId ?? "document-ref"),
      status: String(record.status ?? "unknown"),
      versionId: String(record.versionId ?? "version-ref"),
      sourceName: String(record.sourceName ?? "source-ref"),
    };
  });
}

function toDashboardAgents(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 8).map((item) => {
    const record = asRecord(item);
    const activeVersionId = toActiveVersionId(record);
    return {
      agentId: String(record.agentId ?? "agent-ref"),
      displayName: String(record.displayName ?? record.name ?? "CEDCO R02 agent"),
      activeVersionId,
      status: String(record.status ?? (activeVersionId === "none" ? "unknown" : "active")),
    };
  });
}

function toActiveVersionId(record: Readonly<Record<string, unknown>>): string {
  if (typeof record.activeVersionId === "string" && record.activeVersionId.length > 0) {
    return record.activeVersionId;
  }
  const versions = Array.isArray(record.versions) ? record.versions : [];
  const activeVersion = versions
    .map(asRecord)
    .find((version) => version.status === "active" && typeof version.versionId === "string");
  return typeof activeVersion?.versionId === "string" ? activeVersion.versionId : "none";
}

function toDashboardHandoffTargets(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.slice(0, 8).map((item) => {
    const record = asRecord(item);
    return {
      targetId: String(record.targetId ?? "handoff-ref"),
      targetType: String(record.targetType ?? "human"),
      displayName: String(record.displayName ?? "Handoff target"),
      status: String(record.status ?? "unknown"),
    };
  });
}

type DashboardAppointments = R02OperationalPanelModel["appointments"];
type DashboardAvailability = R02OperationalPanelModel["availability"];
type DashboardKnowledgeDocuments = R02OperationalPanelModel["knowledgeDocuments"];
type DashboardAgents = R02OperationalPanelModel["agents"];
type DashboardHandoffTargets = R02OperationalPanelModel["handoffTargets"];
type DashboardReadinessItem = R02OperationalPanelModel["readinessItems"][number];

function buildR02Readiness(input: {
  readonly appointments: DashboardAppointments;
  readonly availability: DashboardAvailability;
  readonly knowledgeDocuments: DashboardKnowledgeDocuments;
  readonly agents: DashboardAgents;
  readonly handoffTargets: DashboardHandoffTargets;
  readonly auditCount: number;
}) {
  const activeKnowledgeDocuments = input.knowledgeDocuments.filter(
    (item) => item.status === "active",
  ).length;
  const activeAgents = input.agents.filter(
    (item) => item.status === "active" || item.activeVersionId !== "none",
  ).length;
  const activeHandoffTargets = input.handoffTargets.filter(
    (item) => item.status === "active",
  ).length;
  const openAvailabilitySlots = input.availability.filter(
    (item) => item.capacityRemaining > 0,
  ).length;
  const scheduledAppointments = input.appointments.filter((item) =>
    ["scheduled", "rescheduled"].includes(item.status),
  ).length;

  const readinessItems: DashboardReadinessItem[] = [
    readinessItem(
      "Calendario interno",
      openAvailabilitySlots > 0 && scheduledAppointments > 0,
      "Disponibilidad y citas internas leidas desde Prisma.",
      "Falta crear disponibilidad y registrar la primera cita interna.",
    ),
    readinessItem(
      "Base de conocimiento",
      activeKnowledgeDocuments > 0,
      "Hay conocimiento aprobado y activo para busqueda por fuente/version.",
      "Falta cargar, aprobar y activar documentos CEDCO sanitizados.",
    ),
    readinessItem(
      "Asistente activo",
      activeAgents > 0,
      "Hay agente R02 activo con version operativa.",
      "Falta activar una version de agente R02.",
    ),
    readinessItem(
      "Derivacion interna",
      activeHandoffTargets > 0,
      "Hay destino interno de derivacion sin mutacion externa.",
      "Falta guardar destino interno de derivacion.",
    ),
    readinessItem(
      "Auditoria",
      input.auditCount > 0,
      "Writes operativos generan eventos de auditoria sanitizados.",
      "Falta actividad auditada en el tenant.",
    ),
    {
      label: "Calendario externo",
      status: "pending",
      detail:
        "Validacion sin conexion real operativa; faltan credenciales, calendario destino y politica de sync.",
    },
    {
      label: "Piloto de atencion entrante",
      status: "pending",
      detail: "Canal validado; falta ventana aprobada y reglas de piloto operativo.",
    },
    {
      label: "Enrutador interno",
      status: "blocked",
      detail: "Sigue fuera del runtime operativo hasta un refactor de staging separado.",
    },
    {
      label: "Grabacion y transcripcion",
      status: "blocked",
      detail: "Permanece bloqueado salvo aprobacion de control de calidad especifica.",
    },
  ];

  const coreReady = readinessItems.slice(0, 5).every((item) => item.status === "done");
  const hasAnyCoreData =
    input.appointments.length > 0 ||
    input.availability.length > 0 ||
    input.knowledgeDocuments.length > 0 ||
    input.agents.length > 0 ||
    input.handoffTargets.length > 0;

  const integrationStatus: R02OperationalPanelModel["integrationStatus"] = {
    externalCalendar: "pending",
    externalInbound: "pending",
    pbx: "disabled",
    realCallsEnabled: false,
    providerEgressEnabled: false,
    transcriptAudioEnabled: false,
  };

  return {
    overallStatus: (coreReady || hasAnyCoreData
      ? "partial"
      : "blocked") as R02OperationalPanelModel["overallStatus"],
    readinessItems,
    finalOperatorInputs: [
      "Documentos CEDCO sanitizados para cargar la base de conocimiento desde este dashboard.",
      "Credenciales y mapeo del calendario externo para staging.",
      "Destino humano aprobado si se habilita handoff persistente.",
      "Ventana y numero llamante autorizado para piloto inbound.",
      "Decision sobre enrutador interno: mantener fuera o abrir refactor staging.",
      "Aprobacion compliance para cualquier transcripcion o audio adicional.",
    ],
    futureGates: [
      "Activar piloto entrante controlado",
      "Conectar calendario externo de staging",
      "Habilitar destino humano persistente",
      "Refactor de enrutador interno en staging",
      "Control de calidad con transcripcion redactada",
      "Captura de audio controlada",
    ],
    integrationStatus,
    counts: {
      appointments: input.appointments.length,
      openAvailabilitySlots,
      activeKnowledgeDocuments,
      activeAgents,
      activeHandoffTargets,
      auditEvents: input.auditCount,
    },
    auditCount: input.auditCount,
    externalProvidersUsed: false,
    providerEgressEnabled: false,
    liveCallsEnabled: false,
    transcriptAudioAccessed: false,
  };
}

function readinessItem(
  label: string,
  passed: boolean,
  doneDetail: string,
  pendingDetail: string,
): DashboardReadinessItem {
  return {
    label,
    status: passed ? "done" : "pending",
    detail: passed ? doneDetail : pendingDetail,
  };
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" ? (value as Readonly<Record<string, unknown>>) : {};
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}
