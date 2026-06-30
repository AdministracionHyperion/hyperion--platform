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
  }[];
  readonly agents: readonly {
    readonly agentId: string;
    readonly activeVersionId: string;
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
      { documentId: "doc-r02-demo", status: "active", versionId: "doc-r02-demo-v1" },
    ],
    agents: [
      {
        agentId: "cedco-r02-recepcion-agendamiento",
        activeVersionId: "cedco-r02-recepcion-v1",
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
      <section class="dashboard-shell__content">
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
          ${renderAppointments(model)}
          ${renderAvailability(model)}
          ${renderKnowledge(model)}
          ${renderAgents(model)}
          ${renderIntegrations(model)}
        </section>
      </section>
    </main>
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
    <h2>Knowledge base</h2>
    <table>
      <thead><tr><th>Documento</th><th>Estado</th><th>Version</th></tr></thead>
      <tbody>${model.knowledgeDocuments
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.documentId)}</td>
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
    <table>
      <thead><tr><th>Agente</th><th>Version activa</th><th>Estado</th></tr></thead>
      <tbody>${model.agents
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.agentId)}</td>
            <td>${escapeHtml(item.activeVersionId)}</td>
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
