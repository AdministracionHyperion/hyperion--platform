import { escapeHtml, renderBoolean } from "./components/utils";

export interface R02OperationalPanelModel {
  readonly tenantId: string;
  readonly overallStatus: "ready" | "partial" | "blocked";
  readonly appointments: readonly {
    readonly appointmentId: string;
    readonly status: string;
    readonly syncStatus: string;
    readonly serviceTypeId: string;
    readonly startsAt: string;
  }[];
  readonly availability: readonly {
    readonly slotId: string;
    readonly serviceTypeId: string;
    readonly startsAt: string;
    readonly capacityRemaining: number;
  }[];
  readonly knowledgeDocuments: readonly {
    readonly documentId: string;
    readonly status: string;
    readonly versionId: string;
    readonly sourceName: string;
  }[];
  readonly agents: readonly {
    readonly agentId: string;
    readonly displayName: string;
    readonly activeVersionId: string;
    readonly status: string;
  }[];
  readonly handoffTargets: readonly {
    readonly targetId: string;
    readonly targetType: string;
    readonly displayName: string;
    readonly status: string;
  }[];
  readonly integrationStatus: {
    readonly externalCalendar: "disabled" | "pending";
    readonly externalInbound: "disabled" | "pending";
    readonly pbx: "disabled" | "pending";
    readonly realCallsEnabled: false;
    readonly providerEgressEnabled: false;
    readonly transcriptAudioEnabled: false;
  };
  readonly auditCount: number;
}

export function createR02OperationalDemoModel(): R02OperationalPanelModel {
  return {
    tenantId: "cedco-r02-demo",
    overallStatus: "partial",
    appointments: [
      {
        appointmentId: "appointment-r02-demo",
        status: "scheduled",
        syncStatus: "pending",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-03T14:00:00.000Z",
      },
    ],
    availability: [
      {
        slotId: "slot-r02-demo",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-03T14:00:00.000Z",
        capacityRemaining: 1,
      },
    ],
    knowledgeDocuments: [
      {
        documentId: "doc-r02-demo",
        status: "active",
        versionId: "doc-r02-demo-v1",
        sourceName: "cedco-r02-demo.md",
      },
    ],
    agents: [
      {
        agentId: "cedco-r02-recepcion-agendamiento",
        displayName: "CEDCO R02 Recepcion y Agendamiento",
        activeVersionId: "cedco-r02-recepcion-v1",
        status: "active",
      },
    ],
    handoffTargets: [
      {
        targetId: "handoff-human-queue",
        targetType: "human",
        displayName: "Recepcion humana CEDCO",
        status: "active",
      },
    ],
    integrationStatus: {
      externalCalendar: "disabled",
      externalInbound: "disabled",
      pbx: "disabled",
      realCallsEnabled: false,
      providerEgressEnabled: false,
      transcriptAudioEnabled: false,
    },
    auditCount: 4,
  };
}

export function renderR02OperationalPage(model: R02OperationalPanelModel): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CEDCO R02 Operations</title>
    <link rel="stylesheet" href="./styles/operational-dashboard.css" />
  </head>
  <body>
    <main class="dashboard-shell">
      <aside class="dashboard-shell__sidebar">
        <strong>Hyperion</strong>
        <nav>CEDCO R02</nav>
      </aside>
      <section class="dashboard-shell__content" data-r02-tenant="${escapeHtml(model.tenantId)}">
        <header class="dashboard-header">
          <div>
            <h1>CEDCO R02 Operations</h1>
            <p>Tenant ${escapeHtml(model.tenantId)}</p>
          </div>
          <span class="status-pill status-pill--${escapeHtml(model.overallStatus)}">${escapeHtml(
            model.overallStatus,
          )}</span>
        </header>
        <section class="summary-grid">
          ${renderMiniCard("Citas", String(model.appointments.length), "Calendario interno")}
          ${renderMiniCard("RAG", String(model.knowledgeDocuments.length), "Documentos activos")}
          ${renderMiniCard("Agentes", String(model.agents.length), "Versiones controladas")}
          ${renderMiniCard("Auditoria", String(model.auditCount), "Eventos seguros")}
        </section>
        <section class="dashboard-grid">
          ${renderOperatorActions(model)}
          ${renderAppointments(model)}
          ${renderAvailability(model)}
          ${renderKnowledge(model)}
          ${renderAgents(model)}
          ${renderHandoff(model)}
          ${renderIntegrations(model)}
        </section>
      </section>
    </main>
    ${renderR02DashboardScript()}
  </body>
</html>`;
}

function renderMiniCard(label: string, value: string, helperText: string): string {
  return `<article class="summary-card">
    <div class="summary-card__header"><span>${escapeHtml(label)}</span></div>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(helperText)}</small>
  </article>`;
}

function renderAppointments(model: R02OperationalPanelModel): string {
  return `<section class="panel">
    <h2>Calendario y citas</h2>
    <table>
      <thead><tr><th>Cita</th><th>Estado</th><th>Sync</th><th>Servicio</th><th>Inicio</th></tr></thead>
      <tbody>${model.appointments
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.appointmentId)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${escapeHtml(item.syncStatus)}</td>
            <td>${escapeHtml(item.serviceTypeId)}</td>
            <td>${escapeHtml(item.startsAt)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}

function renderAvailability(model: R02OperationalPanelModel): string {
  return `<section class="panel">
    <h2>Disponibilidad</h2>
    <table>
      <thead><tr><th>Slot</th><th>Servicio</th><th>Inicio</th><th>Cupos</th></tr></thead>
      <tbody>${model.availability
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.slotId)}</td>
            <td>${escapeHtml(item.serviceTypeId)}</td>
            <td>${escapeHtml(item.startsAt)}</td>
            <td>${item.capacityRemaining}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}

function renderKnowledge(model: R02OperationalPanelModel): string {
  return `<section class="panel">
    <h2>RAG / Knowledge base</h2>
    <form class="action-form" data-r02-action="upload-knowledge">
      <label>Documento<input name="documentId" value="doc-r02-dashboard" /></label>
      <label>Archivo<input name="sourceName" value="cedco-r02-dashboard.md" /></label>
      <label class="action-form__wide">Contenido<textarea name="contentText">CEDCO agenda orientacion inicial y programacion de cita con calendario interno.</textarea></label>
      <button type="submit">Cargar RAG</button>
    </form>
    <form class="inline-actions" data-r02-action="knowledge-transition">
      <input name="documentId" value="${escapeHtml(model.knowledgeDocuments[0]?.documentId ?? "doc-r02-dashboard")}" />
      <button name="transition" value="process" type="submit">Procesar</button>
      <button name="transition" value="approve" type="submit">Aprobar</button>
      <button name="transition" value="activate" type="submit">Activar</button>
    </form>
    <form class="inline-actions" data-r02-action="knowledge-search">
      <input name="queryText" value="orientacion inicial cita" />
      <button type="submit">Probar busqueda</button>
    </form>
    <table>
      <thead><tr><th>Documento</th><th>Fuente</th><th>Estado</th><th>Version</th></tr></thead>
      <tbody>${model.knowledgeDocuments
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.documentId)}</td>
            <td>${escapeHtml(item.sourceName)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${escapeHtml(item.versionId)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}

function renderAgents(model: R02OperationalPanelModel): string {
  return `<section class="panel">
    <h2>Agentes</h2>
    <form class="action-form" data-r02-action="agent-version">
      <label>Agente<input name="agentId" value="${escapeHtml(model.agents[0]?.agentId ?? "cedco-r02-recepcion-agendamiento")}" /></label>
      <label>Version<input name="versionId" value="cedco-r02-dashboard-v2" /></label>
      <label>Saludo<input name="greeting" value="Hola, gracias por comunicarte con CEDCO." /></label>
      <label class="action-form__wide">Prompt<textarea name="prompt">Consulta RAG aprobado y disponibilidad interna antes de confirmar una cita.</textarea></label>
      <button type="submit">Crear version</button>
    </form>
    <form class="inline-actions" data-r02-action="agent-transition">
      <input name="versionId" value="${escapeHtml(model.agents[0]?.activeVersionId ?? "cedco-r02-dashboard-v2")}" />
      <button name="transition" value="approve" type="submit">Aprobar</button>
      <button name="transition" value="activate" type="submit">Activar</button>
    </form>
    <form class="inline-actions" data-r02-action="simulate-flow">
      <select name="intent">
        <option value="schedule">agenda</option>
        <option value="knowledge">conocimiento</option>
        <option value="handoff">handoff</option>
      </select>
      <input name="queryText" value="quiero programar una cita" />
      <button type="submit">Simular</button>
    </form>
    <table>
      <thead><tr><th>Agente</th><th>Nombre</th><th>Version activa</th><th>Estado</th></tr></thead>
      <tbody>${model.agents
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.agentId)}</td>
            <td>${escapeHtml(item.displayName)}</td>
            <td>${escapeHtml(item.activeVersionId)}</td>
            <td>${escapeHtml(item.status)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}

function renderOperatorActions(model: R02OperationalPanelModel): string {
  return `<section class="panel panel--wide">
    <h2>Operacion diaria</h2>
    <form class="inline-actions" data-r02-action="seed-demo">
      <button type="submit">Sembrar demo</button>
      <output data-r02-output="seed-demo"></output>
    </form>
    <form class="action-form" data-r02-action="availability">
      <label>Slot<input name="slotId" value="slot-r02-dashboard" /></label>
      <label>Recurso<input name="resourceId" value="cedco-r02-recepcion" /></label>
      <label>Sede<input name="siteId" value="cedco-main-site" /></label>
      <label>Servicio<input name="serviceTypeId" value="consulta-general" /></label>
      <label>Inicio<input name="startsAt" value="${escapeHtml(nextIsoHour())}" /></label>
      <label>Cupos<input name="capacity" type="number" min="1" max="20" value="1" /></label>
      <button type="submit">Crear disponibilidad</button>
    </form>
    <form class="action-form" data-r02-action="appointment">
      <label>Cita<input name="appointmentId" value="appointment-r02-dashboard" /></label>
      <label>Slot<input name="slotId" value="${escapeHtml(model.availability[0]?.slotId ?? "slot-r02-dashboard")}" /></label>
      <label>Paciente ref<input name="patientRef" value="patient-demo-dashboard" /></label>
      <button type="submit">Crear cita</button>
    </form>
    <output class="action-log" data-r02-output="global"></output>
  </section>`;
}

function renderHandoff(model: R02OperationalPanelModel): string {
  return `<section class="panel">
    <h2>Handoff</h2>
    <form class="action-form" data-r02-action="handoff-target">
      <label>Target<input name="targetId" value="handoff-human-queue" /></label>
      <label>Tipo<select name="targetType"><option value="human">humano</option><option value="pbx">pbx</option><option value="twilio_fallback">twilio fallback</option></select></label>
      <label>Nombre<input name="displayName" value="Recepcion humana CEDCO" /></label>
      <label>Ruta ref<input name="routeRef" value="human_queue_demo" /></label>
      <button type="submit">Guardar handoff</button>
    </form>
    <table>
      <thead><tr><th>Target</th><th>Tipo</th><th>Nombre</th><th>Estado</th></tr></thead>
      <tbody>${model.handoffTargets
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.targetId)}</td>
            <td>${escapeHtml(item.targetType)}</td>
            <td>${escapeHtml(item.displayName)}</td>
            <td>${escapeHtml(item.status)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>
  </section>`;
}

function renderIntegrations(model: R02OperationalPanelModel): string {
  const status = model.integrationStatus;
  return `<section class="panel">
    <h2>Integraciones</h2>
    <dl class="kv-grid">
      <dt>Calendario externo</dt><dd>${escapeHtml(status.externalCalendar)}</dd>
      <dt>Inbound externo</dt><dd>${escapeHtml(status.externalInbound)}</dd>
      <dt>PBX</dt><dd>${escapeHtml(status.pbx)}</dd>
      <dt>Llamadas reales</dt><dd>${renderBoolean(status.realCallsEnabled)}</dd>
      <dt>Egress provider</dt><dd>${renderBoolean(status.providerEgressEnabled)}</dd>
      <dt>Transcript/audio</dt><dd>${renderBoolean(status.transcriptAudioEnabled)}</dd>
    </dl>
  </section>`;
}

function renderR02DashboardScript(): string {
  return `<script>
(() => {
  const root = document.querySelector("[data-r02-tenant]");
  if (!root) return;
  const tenant = root.getAttribute("data-r02-tenant");
  const apiBase = "/api/v1/tenants/" + encodeURIComponent(tenant) + "/r02";
  const output = document.querySelector("[data-r02-output='global']");
  const write = (message) => {
    if (output) output.textContent = message;
  };
  const jsonHeaders = { "content-type": "application/json" };
  const postJson = async (path, body) => {
    const response = await fetch(apiBase + path, {
      method: "POST",
      headers: jsonHeaders,
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "request failed");
    return payload.data;
  };
  const formData = (form) => Object.fromEntries(new FormData(form).entries());
  const isoPlusMinutes = (value, minutes) => new Date(new Date(value).getTime() + minutes * 60000).toISOString();

  document.querySelectorAll("form[data-r02-action]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const action = form.getAttribute("data-r02-action");
      const data = formData(form);
      try {
        if (action === "seed-demo") {
          await postJson("/demo/seed", {});
        }
        if (action === "availability") {
          await postJson("/calendar/availability", {
            slotId: data.slotId,
            resourceId: data.resourceId,
            siteId: data.siteId,
            serviceTypeId: data.serviceTypeId,
            startsAt: new Date(data.startsAt).toISOString(),
            endsAt: isoPlusMinutes(data.startsAt, 30),
            capacity: Number(data.capacity || 1),
            metadata: { source: "r02-dashboard" },
          });
        }
        if (action === "appointment") {
          await postJson("/appointments", {
            appointmentId: data.appointmentId,
            slotId: data.slotId,
            patientRef: data.patientRef,
            metadata: { source: "r02-dashboard" },
          });
        }
        if (action === "upload-knowledge") {
          await postJson("/knowledge-documents/upload", {
            documentId: data.documentId,
            sourceName: data.sourceName,
            contentText: data.contentText,
            metadata: { source: "r02-dashboard" },
          });
        }
        if (action === "knowledge-transition") {
          await postJson("/knowledge-documents/" + encodeURIComponent(data.documentId) + "/" + data.transition, {});
        }
        if (action === "knowledge-search") {
          await postJson("/knowledge/search-test", { queryText: data.queryText, limit: 5 });
        }
        if (action === "agent-version") {
          await postJson("/agents/" + encodeURIComponent(data.agentId) + "/versions", {
            versionId: data.versionId,
            greeting: data.greeting,
            prompt: data.prompt,
          });
        }
        if (action === "agent-transition") {
          await postJson("/agents/" + encodeURIComponent(data.versionId) + "/" + data.transition, {});
        }
        if (action === "simulate-flow") {
          await postJson("/agent-flow/simulate", {
            simulationId: "sim-r02-dashboard-" + Date.now(),
            intent: data.intent,
            queryText: data.queryText,
          });
        }
        if (action === "handoff-target") {
          await postJson("/handoff-targets", {
            targetId: data.targetId,
            targetType: data.targetType,
            displayName: data.displayName,
            routeRef: data.routeRef,
            status: "active",
            metadata: { source: "r02-dashboard", providerMutation: false },
          });
        }
        write("accion completada");
      } catch (error) {
        write("error: " + (error instanceof Error ? error.message : "fallo desconocido"));
      }
    });
  });
})();
</script>`;
}

function nextIsoHour(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date.toISOString();
}
