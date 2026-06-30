import { escapeHtml } from "./components/utils";

export type R02DashboardModule = "agenda" | "conocimiento" | "asistente" | "derivaciones";

export interface R02OperationalPanelModel {
  readonly tenantId: string;
  readonly activeModule: R02DashboardModule;
  readonly workspaceName: string;
  readonly viewer: {
    readonly actorId: string;
    readonly roleLabel: string;
  };
  readonly capabilities: {
    readonly canViewCalendar: boolean;
    readonly canManageCalendar: boolean;
    readonly canViewKnowledge: boolean;
    readonly canManageKnowledge: boolean;
    readonly canApproveKnowledge: boolean;
    readonly canViewAgents: boolean;
    readonly canManageAgents: boolean;
    readonly canApproveAgents: boolean;
    readonly canSimulateFlow: boolean;
    readonly canViewHandoff: boolean;
    readonly canManageHandoff: boolean;
    readonly canViewIntegrations: boolean;
    readonly canSyncCalendar: boolean;
    readonly canReadAudit: boolean;
  };
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
  readonly readinessItems: readonly {
    readonly label: string;
    readonly status: "done" | "pending" | "blocked";
    readonly detail: string;
  }[];
  readonly finalOperatorInputs: readonly string[];
  readonly futureGates: readonly string[];
  readonly auditCount: number;
  readonly auditRestricted: boolean;
}

export function createR02OperationalDemoModel(): R02OperationalPanelModel {
  return {
    tenantId: "cedco",
    activeModule: "agenda",
    workspaceName: "CEDCO",
    viewer: {
      actorId: "operador",
      roleLabel: "Administracion CEDCO",
    },
    capabilities: {
      canViewCalendar: true,
      canManageCalendar: true,
      canViewKnowledge: true,
      canManageKnowledge: true,
      canApproveKnowledge: true,
      canViewAgents: true,
      canManageAgents: true,
      canApproveAgents: true,
      canSimulateFlow: true,
      canViewHandoff: true,
      canManageHandoff: true,
      canViewIntegrations: true,
      canSyncCalendar: true,
      canReadAudit: true,
    },
    overallStatus: "partial",
    appointments: [],
    availability: [],
    knowledgeDocuments: [],
    agents: [],
    handoffTargets: [],
    integrationStatus: {
      externalCalendar: "disabled",
      externalInbound: "disabled",
      pbx: "disabled",
      realCallsEnabled: false,
      providerEgressEnabled: false,
      transcriptAudioEnabled: false,
    },
    readinessItems: [
      {
        label: "Operacion diaria",
        status: "done",
        detail: "Agenda, base de conocimiento, asistente y derivaciones operativos.",
      },
      {
        label: "Canal de atencion entrante",
        status: "done",
        detail:
          "Numero operativo enlazado al asistente de recepcion para validaciones controladas.",
      },
      {
        label: "Sincronizacion de agenda",
        status: "pending",
        detail: "Faltan credenciales y mapeo de agenda externa cuando se autorice.",
      },
      {
        label: "Handoff persistente",
        status: "pending",
        detail: "Falta decidir si queda activo y aportar destino aprobado por canal privado.",
      },
      {
        label: "Enrutador de llamadas",
        status: "blocked",
        detail: "Requiere refactor separado de runtime; hoy queda fuera de la operacion diaria.",
      },
      {
        label: "Grabacion y transcripcion",
        status: "blocked",
        detail: "Sigue bloqueado salvo aprobacion puntual de control de calidad.",
      },
    ],
    finalOperatorInputs: [
      "Credenciales del canal de comunicaciones solo por terminal privada cuando toque verificarlo.",
      "Credenciales y mapeo de agenda externa cuando se autorice.",
      "Documentos CEDCO sanitizados para cargar la base de conocimiento desde este dashboard.",
      "Destino humano aprobado si se habilita handoff persistente.",
      "Ventana y numero llamante autorizado para piloto inbound.",
      "Decision sobre enrutador interno: mantener fuera o abrir refactor separado.",
    ],
    futureGates: [
      "Activar piloto entrante controlado",
      "Conectar agenda externa autorizada",
      "Habilitar destino humano persistente",
      "Refactor de enrutador interno",
      "Control de calidad con transcripcion redactada",
      "Captura de audio controlada",
    ],
    auditCount: 0,
    auditRestricted: false,
  };
}

export function renderR02OperationalPage(model: R02OperationalPanelModel): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Centro operativo CEDCO</title>
    <link rel="stylesheet" href="./styles/operational-dashboard.css" />
  </head>
  <body>
    <main class="dashboard-shell">
      <aside class="dashboard-shell__sidebar">
        <div class="brand-lockup">
          <strong>${escapeHtml(model.workspaceName)}</strong>
          <span>Centro operativo</span>
        </div>
        <nav class="sidebar-nav" aria-label="Secciones">
          ${renderSidebarNav(model)}
        </nav>
      </aside>
      <section class="dashboard-shell__content" data-r02-tenant="${escapeHtml(model.tenantId)}">
        <header class="dashboard-header">
          <div>
            <span class="dashboard-eyebrow">Recepcion y agendamiento</span>
            <h1>Centro operativo CEDCO</h1>
            <p>Agenda, base de conocimiento, asistente y derivaciones en un solo lugar.</p>
          </div>
          <div class="header-meta">
            <span>${escapeHtml(model.viewer.roleLabel)}</span>
            <span>${escapeHtml(model.workspaceName)}</span>
            <span class="status-pill status-pill--${escapeHtml(model.overallStatus)}">${escapeHtml(
              renderStatusLabel(model.overallStatus),
            )}</span>
          </div>
        </header>
        <section class="summary-grid">
          ${renderModuleSummary(model)}
        </section>
        <section class="module-shell" aria-live="polite">
          ${renderModuleHeader(model)}
          <div class="dashboard-grid dashboard-grid--module">
            ${renderActiveModule(model)}
          </div>
        </section>
      </section>
    </main>
    ${renderR02DashboardScript()}
  </body>
</html>`;
}

function renderSidebarNav(model: R02OperationalPanelModel): string {
  const links = [
    model.capabilities.canViewCalendar ? { module: "agenda", label: "Agenda" } : undefined,
    model.capabilities.canViewKnowledge
      ? { module: "conocimiento", label: "Conocimiento" }
      : undefined,
    model.capabilities.canViewAgents ? { module: "asistente", label: "Asistente" } : undefined,
    model.capabilities.canViewHandoff
      ? { module: "derivaciones", label: "Derivaciones" }
      : undefined,
  ].filter((link): link is { module: R02DashboardModule; label: string } => Boolean(link));
  return links
    .map(
      (link) =>
        `<a href="?modulo=${link.module}"${
          model.activeModule === link.module ? ' aria-current="page"' : ""
        }>${link.label}</a>`,
    )
    .join("");
}

function renderModuleSummary(model: R02OperationalPanelModel): string {
  if (model.activeModule === "agenda") {
    return [
      renderMiniCard("Citas", String(model.appointments.length), "Solicitudes internas"),
      renderMiniCard("Disponibilidad", String(model.availability.length), "Bloques activos"),
      renderMiniCard("Estado", renderStatusLabel(model.overallStatus), "Operacion de agenda"),
    ].join("");
  }
  if (model.activeModule === "conocimiento") {
    return [
      renderMiniCard("Documentos", String(model.knowledgeDocuments.length), "Fuentes controladas"),
      renderMiniCard(
        "Activos",
        String(model.knowledgeDocuments.filter((item) => item.status === "active").length),
        "Listos para consulta",
      ),
      renderMiniCard(
        "Carga",
        model.capabilities.canManageKnowledge ? "Disponible" : "Lectura",
        "Segun rol",
      ),
    ].join("");
  }
  if (model.activeModule === "asistente") {
    return [
      renderMiniCard("Asistentes", String(model.agents.length), "Versiones visibles"),
      renderMiniCard(
        "Activos",
        String(
          model.agents.filter((item) => item.status === "active" || item.activeVersionId !== "none")
            .length,
        ),
        "En uso operativo",
      ),
      renderMiniCard(
        "Simulador",
        model.capabilities.canSimulateFlow ? "Disponible" : "No disponible",
        "Segun rol",
      ),
    ].join("");
  }
  return [
    renderMiniCard("Derivaciones", String(model.handoffTargets.length), "Destinos internos"),
    renderMiniCard(
      "Activas",
      String(model.handoffTargets.filter((item) => item.status === "active").length),
      "Listas para uso",
    ),
    renderMiniCard(
      "Gestion",
      model.capabilities.canManageHandoff ? "Disponible" : "Lectura",
      "Segun rol",
    ),
  ].join("");
}

function renderModuleHeader(model: R02OperationalPanelModel): string {
  const details: Record<R02DashboardModule, { title: string; detail: string }> = {
    agenda: {
      title: "Agenda",
      detail: "Administra disponibilidad y solicitudes internas sin salir de este modulo.",
    },
    conocimiento: {
      title: "Conocimiento",
      detail: "Carga, revisa y consulta documentos aprobados para respuestas controladas.",
    },
    asistente: {
      title: "Asistente",
      detail: "Gestiona versiones, guion operativo y simulaciones antes de usarlo con pacientes.",
    },
    derivaciones: {
      title: "Derivaciones",
      detail: "Configura y revisa destinos humanos aprobados para casos que requieren apoyo.",
    },
  };
  const current = details[model.activeModule];
  return `<header class="module-header">
    <span>Modulo seleccionado</span>
    <h2>${escapeHtml(current.title)}</h2>
    <p>${escapeHtml(current.detail)}</p>
  </header>`;
}

function renderActiveModule(model: R02OperationalPanelModel): string {
  if (model.activeModule === "agenda") {
    return model.capabilities.canViewCalendar
      ? `${renderOperatorActions(model)}${renderAppointments(model)}${renderAvailability(model)}`
      : renderUnavailableModule("Agenda no disponible para tu rol.");
  }
  if (model.activeModule === "conocimiento") {
    return model.capabilities.canViewKnowledge
      ? renderKnowledge(model)
      : renderUnavailableModule("Conocimiento no disponible para tu rol.");
  }
  if (model.activeModule === "asistente") {
    return model.capabilities.canViewAgents
      ? renderAgents(model)
      : renderUnavailableModule("Asistente no disponible para tu rol.");
  }
  return model.capabilities.canViewHandoff
    ? renderHandoff(model)
    : renderUnavailableModule("Derivaciones no disponible para tu rol.");
}

function renderUnavailableModule(message: string): string {
  return `<section class="panel panel--wide">${renderRoleNotice(message)}</section>`;
}

function renderMiniCard(label: string, value: string, helperText: string): string {
  return `<article class="summary-card">
    <div class="summary-card__header"><span>${escapeHtml(label)}</span></div>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(helperText)}</small>
  </article>`;
}

function renderEmptyState(title: string, detail: string): string {
  return `<div class="empty-state">
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(detail)}</span>
  </div>`;
}

function renderRoleNotice(message: string): string {
  return `<p class="role-notice">${escapeHtml(message)}</p>`;
}

function operatorActionSummary(model: R02OperationalPanelModel): string {
  if (model.capabilities.canManageCalendar) {
    return "Prepara disponibilidad, registra solicitudes y valida el flujo operativo desde el panel.";
  }
  if (model.capabilities.canApproveKnowledge || model.capabilities.canApproveAgents) {
    return "Revisa cambios pendientes, aprueba contenido y controla versiones antes de activar operacion.";
  }
  if (model.capabilities.canManageHandoff) {
    return "Gestiona derivaciones y revisa solicitudes que requieren atencion humana.";
  }
  return "Vista de consulta: revisa estado, agenda y evidencia disponible segun tu rol.";
}

function renderAppointments(model: R02OperationalPanelModel): string {
  return `<section class="panel" id="agenda">
    <h2>Calendario y citas</h2>
    ${
      model.appointments.length === 0
        ? renderEmptyState(
            "Aun no hay citas registradas.",
            "Crea disponibilidad y registra la primera solicitud cuando tengas agenda definida.",
          )
        : `<table>
      <thead><tr><th>Solicitud</th><th>Estado</th><th>Agenda externa</th><th>Servicio</th><th>Fecha y hora</th></tr></thead>
      <tbody>${model.appointments
        .map(
          (item) => `<tr>
            <td>${operatorText(item.appointmentId)}</td>
            <td>${operatorText(item.status)}</td>
            <td>${operatorText(item.syncStatus)}</td>
            <td>${operatorText(item.serviceTypeId)}</td>
            <td>${formatDateTime(item.startsAt)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>`
    }
  </section>`;
}

function renderAvailability(model: R02OperationalPanelModel): string {
  return `<section class="panel">
    <h2>Disponibilidad</h2>
    ${
      model.availability.length === 0
        ? renderEmptyState(
            "No hay bloques de agenda activos.",
            "Define horarios, sede y servicio para que el asistente pueda consultar disponibilidad real.",
          )
        : `<table>
      <thead><tr><th>Bloque de agenda</th><th>Servicio</th><th>Fecha y hora</th><th>Cupos</th></tr></thead>
      <tbody>${model.availability
        .map(
          (item) => `<tr>
            <td>${operatorText(item.slotId)}</td>
            <td>${operatorText(item.serviceTypeId)}</td>
            <td>${formatDateTime(item.startsAt)}</td>
            <td>${item.capacityRemaining}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>`
    }
  </section>`;
}

function renderKnowledge(model: R02OperationalPanelModel): string {
  return `<section class="panel" id="conocimiento">
    <h2>Base de conocimiento</h2>
    ${
      model.capabilities.canManageKnowledge
        ? `
    <form class="action-form" data-r02-action="upload-knowledge">
      <label>Documento<input name="documentId" placeholder="documento-operativo-001" required /></label>
      <label>Archivo<input name="sourceName" placeholder="servicios-cedco.md" required /></label>
      <label>Fuente local<input name="ragTextFile" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json" data-r02-local-text-file /></label>
      <label class="action-form__wide">Contenido<textarea name="contentText" placeholder="Pega aqui contenido aprobado y sanitizado." required></textarea></label>
      <button type="submit">Cargar documento</button>
    </form>
        `
        : renderRoleNotice("Tu rol puede consultar conocimiento, pero no cargar documentos.")
    }
    ${
      model.knowledgeDocuments.length > 0
        ? `
    <form class="inline-actions" data-r02-action="knowledge-transition">
      <input name="documentId" value="${operatorInputValue(model.knowledgeDocuments[0]?.documentId, "documento-operativo-001")}" />
      ${model.capabilities.canManageKnowledge ? '<button name="transition" value="process" type="submit">Procesar</button>' : ""}
      ${model.capabilities.canApproveKnowledge ? '<button name="transition" value="approve" type="submit">Aprobar</button>' : ""}
      ${model.capabilities.canApproveKnowledge ? '<button name="transition" value="activate" type="submit">Activar</button>' : ""}
    </form>
        `
        : ""
    }
    <form class="inline-actions" data-r02-action="knowledge-search">
      <input name="queryText" placeholder="Buscar en documentos aprobados" required />
      <button type="submit">Probar busqueda</button>
    </form>
    ${
      model.knowledgeDocuments.length === 0
        ? renderEmptyState(
            "No hay documentos activos.",
            "Carga documentos aprobados de CEDCO para que el asistente responda desde fuentes controladas.",
          )
        : `<table>
      <thead><tr><th>Documento</th><th>Fuente</th><th>Estado</th><th>Version</th></tr></thead>
      <tbody>${model.knowledgeDocuments
        .map(
          (item) => `<tr>
            <td>${operatorText(item.documentId)}</td>
            <td>${operatorText(item.sourceName)}</td>
            <td>${operatorText(item.status)}</td>
            <td>${operatorText(item.versionId)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>`
    }
  </section>`;
}

function renderAgents(model: R02OperationalPanelModel): string {
  return `<section class="panel" id="asistente">
    <h2>Asistente</h2>
    ${
      model.capabilities.canManageAgents
        ? `
    <form class="action-form" data-r02-action="agent-version">
      <label>Agente<input name="agentId" value="${escapeHtml(model.agents[0]?.agentId ?? "cedco-r02-recepcion-agendamiento")}" /></label>
      <label>Version<input name="versionId" placeholder="version-operativa-001" required /></label>
      <label>Saludo<input name="greeting" value="Hola, gracias por comunicarte con CEDCO." /></label>
      <label class="action-form__wide">Guion operativo<textarea name="prompt">Consulta la base de conocimiento aprobada y la disponibilidad interna antes de confirmar una cita.</textarea></label>
      <button type="submit">Crear version</button>
    </form>
        `
        : renderRoleNotice("Tu rol puede revisar el asistente, pero no crear versiones.")
    }
    ${
      model.agents.length > 0 && model.capabilities.canApproveAgents
        ? `
    <form class="inline-actions" data-r02-action="agent-transition">
      <input name="versionId" value="${operatorInputValue(model.agents[0]?.activeVersionId, "version-operativa-001")}" />
      <button name="transition" value="approve" type="submit">Aprobar</button>
      <button name="transition" value="activate" type="submit">Activar</button>
    </form>
        `
        : ""
    }
    ${
      model.capabilities.canSimulateFlow
        ? `
    <form class="inline-actions" data-r02-action="simulate-flow">
      <select name="intent">
        <option value="schedule">agenda</option>
        <option value="knowledge">conocimiento</option>
        <option value="handoff">handoff</option>
      </select>
      <input name="queryText" placeholder="Ej. quiero programar una cita" required />
      <button type="submit">Simular</button>
    </form>
        `
        : ""
    }
    ${
      model.agents.length === 0
        ? renderEmptyState(
            "No hay asistente activo en esta vista.",
            "Crea o activa una version aprobada antes de operar llamadas reales.",
          )
        : `<table>
      <thead><tr><th>Asistente</th><th>Nombre</th><th>Version activa</th><th>Estado</th></tr></thead>
      <tbody>${model.agents
        .map(
          (item) => `<tr>
            <td>${operatorText(item.agentId)}</td>
            <td>${operatorText(item.displayName)}</td>
            <td>${operatorText(item.activeVersionId)}</td>
            <td>${operatorText(item.status)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>`
    }
  </section>`;
}

function renderOperatorActions(model: R02OperationalPanelModel): string {
  return `<section class="panel panel--wide panel--command">
    <div>
      <h2>Operacion diaria</h2>
      <p>${escapeHtml(operatorActionSummary(model))}</p>
    </div>
    ${
      model.capabilities.canManageCalendar
        ? `
    <form class="action-form" data-r02-action="availability">
      <label>Bloque de agenda<input name="slotId" placeholder="bloque-agenda-001" required /></label>
      <label>Agenda<input name="resourceId" placeholder="agenda-recepcion" required /></label>
      <label>Sede<input name="siteId" placeholder="sede-principal" required /></label>
      <label>Servicio<input name="serviceTypeId" placeholder="orientacion-inicial" required /></label>
      <label>Fecha y hora<input name="startsAt" value="${escapeHtml(nextIsoHour())}" /></label>
      <label>Cupos<input name="capacity" type="number" min="1" max="20" value="1" /></label>
      <button type="submit">Crear disponibilidad</button>
    </form>
    <form class="action-form" data-r02-action="appointment">
      <label>Solicitud de cita<input name="appointmentId" placeholder="solicitud-cita-001" required /></label>
      <label>Bloque de agenda<input name="slotId" value="${operatorInputValue(model.availability[0]?.slotId, "")}" placeholder="bloque-agenda-001" required /></label>
      <label>Usuario<input name="patientRef" placeholder="usuario-referencia" required /></label>
      <button type="submit">Crear cita</button>
    </form>
        `
        : renderRoleNotice(
            "Tu rol no puede crear disponibilidad ni citas. Puedes revisar el estado disponible para tu area.",
          )
    }
    ${
      model.capabilities.canSyncCalendar && model.appointments.length > 0
        ? `
    <form class="inline-actions" data-r02-action="external-calendar-sync-dry-run">
      <input name="appointmentId" value="${operatorInputValue(model.appointments[0]?.appointmentId, "")}" />
      <button type="submit">Validar sincronizacion</button>
    </form>
        `
        : ""
    }
    <output class="action-log" data-r02-output="global"></output>
  </section>`;
}

function renderHandoff(model: R02OperationalPanelModel): string {
  return `<section class="panel" id="derivaciones">
    <h2>Derivaciones</h2>
    ${
      model.capabilities.canManageHandoff
        ? `
    <form class="action-form" data-r02-action="handoff-target">
      <label>Destino<input name="targetId" placeholder="equipo-humano-cedco" required /></label>
      <label>Tipo<select name="targetType"><option value="human">equipo humano</option><option value="pbx">enrutador interno</option></select></label>
      <label>Nombre<input name="displayName" placeholder="Recepcion humana CEDCO" required /></label>
      <label>Ruta interna<input name="routeRef" placeholder="cola-humana" required /></label>
      <button type="submit">Guardar derivacion</button>
    </form>
        `
        : renderRoleNotice("Tu rol puede revisar derivaciones, pero no cambiar destinos.")
    }
    ${
      model.handoffTargets.length === 0
        ? renderEmptyState(
            "No hay destinos de derivacion activos.",
            "Define un destino humano aprobado antes de habilitar transferencia persistente.",
          )
        : `<table>
      <thead><tr><th>Destino</th><th>Tipo</th><th>Nombre</th><th>Estado</th></tr></thead>
      <tbody>${model.handoffTargets
        .map(
          (item) => `<tr>
            <td>${operatorText(item.targetId)}</td>
            <td>${operatorText(item.targetType)}</td>
            <td>${operatorText(item.displayName)}</td>
            <td>${operatorText(item.status)}</td>
          </tr>`,
        )
        .join("")}</tbody>
    </table>`
    }
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
  const textSourceNamePattern = /\\.(txt|md|csv|json)$/i;
  const maxKnowledgeTextBytes = 20000;

  document.querySelectorAll("[data-r02-local-text-file]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const form = input.closest("form");
      try {
        if (!textSourceNamePattern.test(file.name)) {
          input.value = "";
          write("error: fuente local no soportada");
          return;
        }
        if (file.size > maxKnowledgeTextBytes) {
          input.value = "";
          write("error: fuente local supera 20KB");
          return;
        }
        const text = await file.text();
        if (new Blob([text]).size > maxKnowledgeTextBytes) {
          input.value = "";
          write("error: contenido local supera 20KB");
          return;
        }
        if (form?.elements?.sourceName) form.elements.sourceName.value = file.name;
        if (form?.elements?.contentText) form.elements.contentText.value = text;
        write("fuente local lista");
      } catch (error) {
        input.value = "";
        write("error: " + (error instanceof Error ? error.message : "fallo al leer fuente local"));
      }
    });
  });

  document.querySelectorAll("form[data-r02-action]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const action = form.getAttribute("data-r02-action");
      const data = formData(form);
      try {
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
        if (action === "external-calendar-sync-dry-run") {
          await postJson("/external-calendar/" + encodeURIComponent(data.appointmentId) + "/sync-dry-run", {});
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
            metadata: { source: "r02-dashboard", externalMutation: false },
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

function renderStatusLabel(status: R02OperationalPanelModel["overallStatus"]): string {
  if (status === "ready") return "operativo";
  if (status === "partial") return "parcial";
  return "bloqueado";
}

function operatorText(value: string): string {
  return escapeHtml(neutralizeOperatorText(value));
}

function operatorInputValue(value: string | undefined, fallback: string): string {
  return escapeHtml(neutralizeOperatorText(value ?? fallback));
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return escapeHtml(
    new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Bogota",
    }).format(date),
  );
}

function neutralizeOperatorText(value: string): string {
  const exactLabels: Record<string, string> = {
    active: "activo",
    archived: "archivado",
    blocked: "bloqueado",
    cancelled: "cancelada",
    disabled: "desactivado",
    done: "listo",
    failed: "fallo",
    human: "equipo humano",
    partial: "parcial",
    pending: "pendiente",
    ready: "operativo",
    scheduled: "programada",
    synced: "sincronizada",
  };
  const exact = exactLabels[value.toLowerCase()];
  if (exact) {
    return exact;
  }

  return value
    .replace(/appointment/giu, "cita")
    .replace(/patient/giu, "usuario")
    .replace(/slot/giu, "bloque")
    .replace(/demo/giu, "operativo")
    .replace(/dashboard/giu, "panel")
    .replace(/main-site/giu, "sede-principal")
    .replace(/google/giu, "externo")
    .replace(/twilio/giu, "canal")
    .replace(/elevenlabs|11labs/giu, "asistente")
    .replace(/knowledge base/giu, "base de conocimiento")
    .replace(/rag/giu, "conocimiento")
    .replace(/pbx/giu, "enrutador")
    .replace(/handoff/giu, "derivacion")
    .replace(/provider/giu, "externo")
    .replace(/transcript\/audio/giu, "grabacion y transcripcion");
}

function nextIsoHour(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date.toISOString();
}
