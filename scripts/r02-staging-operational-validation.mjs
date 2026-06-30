#!/usr/bin/env node

const baseUrl = (process.env.R02_STAGING_BASE_URL ?? "http://127.0.0.1:18082").replace(/\/$/u, "");
const tenantId = process.env.R02_STAGING_TENANT_ID ?? "cedco-demo";
const nowSuffix = new Date()
  .toISOString()
  .replace(/[^0-9]/gu, "")
  .slice(0, 12);
const blockedEvidencePattern =
  /api[_-]?key|phone_number_id|agent_id|audio_url|raw_transcript|sip_password|\+\d[\d\s().-]{7,}\d/iu;

let adminHeaders = {
  "content-type": "application/json",
  "x-actor-id": "r02-demo-admin",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": `corr-r02-staging-${nowSuffix}`,
  "x-request-source": "r02-staging-operational-validation",
};

let viewerHeaders = {
  ...adminHeaders,
  "x-actor-id": "r02-demo-viewer",
  "x-actor-roles": "tenant-viewer",
  "x-correlation-id": `corr-r02-staging-viewer-${nowSuffix}`,
};

const basePath = `/api/v1/tenants/${encodeURIComponent(tenantId)}/r02`;
const otherTenantPath = "/api/v1/tenants/cedco-demo-other/r02";

const result = {
  base_url_loopback:
    baseUrl.startsWith("http://127.0.0.1") || baseUrl.startsWith("http://localhost"),
  tenant_ref: tenantId,
  db_backed_storage: false,
  dashboard_route_loaded: false,
  seed_created: false,
  seed_idempotent: false,
  availability_listed: false,
  appointment_created: false,
  appointment_create_read: false,
  appointment_rescheduled: false,
  appointment_reschedule_read: false,
  appointment_cancelled: false,
  appointment_cancel_read: false,
  google_adapter_disabled: false,
  rag_document_created: false,
  rag_search_returned_source: false,
  external_embeddings_used: false,
  agent_created: false,
  agent_version_activated: false,
  agent_flow_simulated: false,
  handoff_target_simulated: false,
  rbac_viewer_write_denied: false,
  tenant_isolation_passed: false,
  local_staging_auth_used: false,
  external_providers_used: false,
  transcript_audio_accessed: false,
};

const slotOne = `slot-r02-staging-${nowSuffix}-a`;
const slotTwo = `slot-r02-staging-${nowSuffix}-b`;
const slotThree = `slot-r02-staging-${nowSuffix}-c`;
const appointmentId = `appointment-r02-staging-${nowSuffix}`;
const flowAppointmentId = `appointment-r02-flow-${nowSuffix}`;
const documentId = `doc-r02-staging-${nowSuffix}`;
const agentVersionId = `cedco-r02-version-${nowSuffix}`;

await expectStatus("GET", "/health", undefined, 200);
await configureAuthHeaders();

const dashboard = await request("GET", `${basePath}/dashboard`, undefined, 200, adminHeaders);
result.dashboard_route_loaded =
  dashboard.text.includes("Centro operativo CEDCO") && !blockedEvidencePattern.test(dashboard.text);

const seed = await request("POST", `${basePath}/demo/seed`, {}, 200);
result.seed_created = seed.json.data?.seeded === true;
result.seed_idempotent = seed.json.data?.idempotent === true;
result.db_backed_storage = seed.json.data?.storageMode === "prisma";

await createAvailability(slotOne, "2026-07-06T14:00:00.000Z");
await createAvailability(slotTwo, "2026-07-06T15:00:00.000Z");
await createAvailability(slotThree, "2026-07-06T16:00:00.000Z");

const availability = await request(
  "GET",
  `${basePath}/calendar/availability?serviceTypeId=consulta-general`,
  undefined,
  200,
);
result.availability_listed =
  Array.isArray(availability.json.data) && availability.json.data.length >= 3;

const appointment = await request(
  "POST",
  `${basePath}/appointments`,
  {
    appointmentId,
    slotId: slotOne,
    patientRef: "patient-ref-demo-r02",
    metadata: { source: "r02-staging-validation", purpose: "demo_seed" },
  },
  201,
);
result.appointment_created = appointment.json.data?.status === "scheduled";
let appointments = await request("GET", `${basePath}/appointments`, undefined, 200);
result.appointment_create_read = appointments.json.data?.some(
  (item) => item.appointmentId === appointmentId && item.status === "scheduled",
);

const google = await request(
  "POST",
  `${basePath}/google-calendar/${appointmentId}/sync-test`,
  {},
  200,
);
result.google_adapter_disabled =
  google.json.data?.attempted === false && google.json.data?.errorClass === "disabled";

const rescheduled = await request(
  "POST",
  `${basePath}/appointments/${appointmentId}/reschedule`,
  { newSlotId: slotTwo },
  200,
);
result.appointment_rescheduled = rescheduled.json.data?.status === "rescheduled";
appointments = await request("GET", `${basePath}/appointments`, undefined, 200);
result.appointment_reschedule_read = appointments.json.data?.some(
  (item) => item.appointmentId === appointmentId && item.status === "rescheduled",
);

const cancelled = await request(
  "POST",
  `${basePath}/appointments/${appointmentId}/cancel`,
  {},
  200,
);
result.appointment_cancelled = cancelled.json.data?.status === "cancelled";
appointments = await request("GET", `${basePath}/appointments`, undefined, 200);
result.appointment_cancel_read = appointments.json.data?.some(
  (item) => item.appointmentId === appointmentId && item.status === "cancelled",
);

await request(
  "POST",
  `${basePath}/knowledge-bases`,
  { knowledgeBaseId: `kb-r02-staging-${nowSuffix}`, name: "CEDCO R02 Demo Knowledge" },
  201,
);
const upload = await request(
  "POST",
  `${basePath}/knowledge-documents/upload`,
  {
    documentId,
    sourceName: "cedco-r02-demo.md",
    contentText:
      "CEDCO Demo atiende programacion de cita, consulta general y orientacion inicial. " +
      "La agenda interna es fuente principal y el calendario externo permanece deshabilitado en staging.",
    metadata: { source: "r02-staging-validation", purpose: "demo_knowledge" },
  },
  201,
);
result.rag_document_created = upload.json.data?.documentId === documentId;

for (const action of ["process", "approve", "activate"]) {
  await request("POST", `${basePath}/knowledge-documents/${documentId}/${action}`, {}, 200);
}
const search = await request(
  "POST",
  `${basePath}/knowledge/search-test`,
  { queryText: "programacion cita agenda interna", limit: 3 },
  200,
);
result.rag_search_returned_source = Array.isArray(search.json.data) && search.json.data.length > 0;

const agent = await request("POST", `${basePath}/agents`, { seedDemo: true }, 201);
result.agent_created = Boolean(agent.json.data?.agentId);
await request(
  "POST",
  `${basePath}/agents/cedco-r02-recepcion-agendamiento/versions`,
  {
    versionId: agentVersionId,
    greeting: "Hola, gracias por comunicarte con CEDCO.",
    prompt: "Consulta conocimiento aprobado y disponibilidad antes de crear una cita interna.",
  },
  201,
);
await request("POST", `${basePath}/agents/${agentVersionId}/approve`, {}, 200);
const activeAgent = await request("POST", `${basePath}/agents/${agentVersionId}/activate`, {}, 200);
result.agent_version_activated = activeAgent.json.data?.status === "active";

const simulation = await request(
  "POST",
  `${basePath}/agent-flow/simulate`,
  {
    simulationId: `sim-r02-staging-${nowSuffix}`,
    intent: "schedule",
    queryText: "quiero programar una cita",
    slotId: slotThree,
    appointmentId: flowAppointmentId,
    patientRef: "patient-ref-demo-r02-flow",
  },
  200,
);
result.agent_flow_simulated =
  simulation.json.data?.appointmentCreated === true &&
  simulation.json.data?.externalProvidersUsed === false &&
  simulation.json.data?.transcriptAudioAccessed === false;
result.external_providers_used = simulation.json.data?.externalProvidersUsed === true;
result.transcript_audio_accessed = simulation.json.data?.transcriptAudioAccessed === true;

const handoff = await request(
  "POST",
  `${basePath}/agent-flow/simulate`,
  {
    simulationId: `sim-r02-handoff-${nowSuffix}`,
    intent: "handoff",
    queryText: "necesito hablar con una persona",
  },
  200,
);
result.handoff_target_simulated = handoff.json.data?.handoffCreated === true;

const denied = await request(
  "POST",
  `${basePath}/calendar/availability`,
  {
    slotId: `slot-r02-denied-${nowSuffix}`,
    resourceId: "cedco-r02-recepcion",
    siteId: "cedco-main-site",
    serviceTypeId: "consulta-general",
    startsAt: "2026-07-07T14:00:00.000Z",
    endsAt: "2026-07-07T14:30:00.000Z",
  },
  403,
  viewerHeaders,
);
result.rbac_viewer_write_denied = denied.json.error?.code === "forbidden";

const otherTenant = await requestWithExpectedStatuses(
  "GET",
  `${otherTenantPath}/appointments`,
  undefined,
  [200, 401, 403],
);
result.tenant_isolation_passed =
  (otherTenant.response.status === 200 &&
    Array.isArray(otherTenant.json.data) &&
    otherTenant.json.data.length === 0) ||
  ["missing_actor", "forbidden"].includes(otherTenant.json.error?.code);

const audit = await request("GET", `${basePath}/audit`, undefined, 200);
assertNoBlockedEvidence(JSON.stringify(audit.json));

const requiredTrue = [
  "dashboard_route_loaded",
  "db_backed_storage",
  "seed_created",
  "seed_idempotent",
  "availability_listed",
  "appointment_created",
  "appointment_create_read",
  "appointment_rescheduled",
  "appointment_reschedule_read",
  "appointment_cancelled",
  "appointment_cancel_read",
  "google_adapter_disabled",
  "rag_document_created",
  "rag_search_returned_source",
  "agent_created",
  "agent_version_activated",
  "agent_flow_simulated",
  "handoff_target_simulated",
  "rbac_viewer_write_denied",
  "tenant_isolation_passed",
];

for (const key of requiredTrue) {
  if (result[key] !== true) {
    throw new Error(`R02 staging validation failed: ${key}`);
  }
}
if (
  result.external_embeddings_used ||
  result.external_providers_used ||
  result.transcript_audio_accessed
) {
  throw new Error("R02 staging validation touched a prohibited external/runtime capability.");
}

console.log(JSON.stringify(result, null, 2));
console.log("R02_STAGING_OPERATIONAL_VALIDATION_PASSED");

async function createAvailability(slotId, startsAt) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return request(
    "POST",
    `${basePath}/calendar/availability`,
    {
      slotId,
      resourceId: "cedco-r02-recepcion",
      siteId: "cedco-main-site",
      serviceTypeId: "consulta-general",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      capacity: 2,
      metadata: { source: "r02-staging-validation", purpose: "availability_demo" },
    },
    201,
  );
}

async function expectStatus(method, path, payload, expectedStatus) {
  return request(method, path, payload, expectedStatus);
}

async function requestWithExpectedStatuses(method, path, payload, expectedStatuses) {
  const response = await requestRaw(method, path, payload, adminHeaders);
  if (!expectedStatuses.includes(response.response.status)) {
    throw new Error(
      `${method} ${path} expected ${expectedStatuses.join("/")}, got ${
        response.response.status
      }: ${response.text.slice(0, 240)}`,
    );
  }
  assertNoBlockedEvidence(response.text);
  return response;
}

async function configureAuthHeaders() {
  const adminSessionToken =
    process.env.R02_STAGING_ADMIN_SESSION_TOKEN ??
    (await loginIfConfigured(
      process.env.R02_STAGING_ADMIN_LOGIN_REF,
      process.env.R02_STAGING_ADMIN_CREDENTIAL,
    ));
  if (adminSessionToken) {
    adminHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${adminSessionToken}`,
      "x-correlation-id": `corr-r02-staging-${nowSuffix}`,
      "x-request-source": "r02-staging-operational-validation",
    };
    result.local_staging_auth_used = true;
  }

  const viewerSessionToken =
    process.env.R02_STAGING_VIEWER_SESSION_TOKEN ??
    (await loginIfConfigured(
      process.env.R02_STAGING_VIEWER_LOGIN_REF,
      process.env.R02_STAGING_VIEWER_CREDENTIAL,
    ));
  if (viewerSessionToken) {
    viewerHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${viewerSessionToken}`,
      "x-correlation-id": `corr-r02-staging-viewer-${nowSuffix}`,
      "x-request-source": "r02-staging-operational-validation",
    };
    result.local_staging_auth_used = true;
  }
}

async function loginIfConfigured(loginRef, credential) {
  if (!loginRef || !credential) {
    return undefined;
  }
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tenantId, loginRef, credential }),
  });
  const text = await response.text();
  if (response.status !== 200) {
    throw new Error(`auth login expected 200, got ${response.status}: ${text.slice(0, 120)}`);
  }
  assertNoBlockedEvidence(text);
  const json = JSON.parse(text);
  return json.data?.sessionToken;
}

async function request(method, path, payload, expectedStatus, headers = adminHeaders) {
  const response = await requestRaw(method, path, payload, headers);
  if (response.response.status !== expectedStatus) {
    throw new Error(
      `${method} ${path} expected ${expectedStatus}, got ${response.response.status}: ${response.text.slice(0, 240)}`,
    );
  }
  assertNoBlockedEvidence(response.text);
  return response;
}

async function requestRaw(method, path, payload, headers = adminHeaders) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { response, text, json };
}

function assertNoBlockedEvidence(text) {
  if (blockedEvidencePattern.test(text)) {
    throw new Error("Blocked sensitive evidence appeared in R02 staging validation output.");
  }
}
