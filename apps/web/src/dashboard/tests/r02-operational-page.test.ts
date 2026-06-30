import { describe, expect, it } from "vitest";
import { createR02OperationalDemoModel, renderR02OperationalPage } from "../r02-operational-page";

describe("CEDCO R02 operational page", () => {
  it("renders operational data without provider or demo language", () => {
    const html = renderR02OperationalPage(modelWithOperationalData());

    expect(html).toContain("Centro operativo CEDCO");
    expect(html).toContain("Calendario y citas");
    expect(html).toContain("Base de conocimiento");
    expect(html).toContain('data-r02-action="upload-knowledge"');
    expect(html).toContain("data-r02-local-text-file");
    expect(html).toContain('accept=".txt,.md,.csv,.json');
    expect(html).toContain("Cargar documento");
    expect(html).toContain('data-r02-action="external-calendar-sync-dry-run"');
    expect(html).toContain("Validar sincronizacion");
    expect(html).toContain("Asistente");
    expect(html).toContain("Derivaciones");
    expect(html).toContain("Estado de canales");
    expect(html).toContain("Preparacion y pendientes");
    expect(html).toContain("Conectar agenda externa autorizada");
    expect(html).toContain("Documentos CEDCO sanitizados");
    expect(html).toContain("desactivado");
    expect(html).not.toMatch(/demo|Sembrar demo|seed-demo|cedco-demo/iu);
    expect(html).not.toMatch(
      /Google|Twilio|ElevenLabs|11labs|Knowledge base|Egress provider|Transcript\/audio/iu,
    );
  });

  it("renders internal operator actions without sensitive payload or real-call controls", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());

    expect(html).not.toMatch(/phoneNumber|rawTranscript|audioUrl|recordingUrl|token|secret/iu);
    expect(html).not.toMatch(/Sembrar demo|seed-demo|cedco-demo/iu);
    expect(html).toContain("fetch(apiBase");
    expect(html).not.toMatch(/outbound-call|dispatch\s*\(|externalMutation:\s*true/iu);
    expect(html).not.toMatch(/accept="[^"]*pdf|accept="[^"]*docx/iu);
  });

  it("renders a from-zero workspace with professional empty states", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());

    expect(html).toContain("Aun no hay citas registradas.");
    expect(html).toContain("No hay documentos activos.");
    expect(html).toContain("No hay asistente activo en esta vista.");
    expect(html).toContain("No hay destinos de derivacion activos.");
    expect(html).not.toMatch(/demo|Sembrar demo|seed-demo|cedco-demo/iu);
  });

  it("hides write actions for report-only roles", () => {
    const model = createR02OperationalDemoModel();
    const html = renderR02OperationalPage({
      ...model,
      viewer: { actorId: "reports-viewer", roleLabel: "Consulta y reportes" },
      capabilities: {
        ...model.capabilities,
        canManageCalendar: false,
        canManageKnowledge: false,
        canApproveKnowledge: false,
        canManageAgents: false,
        canApproveAgents: false,
        canSimulateFlow: false,
        canManageHandoff: false,
        canSyncCalendar: false,
        canReadAudit: false,
      },
      auditRestricted: true,
    });

    expect(html).toContain("Consulta y reportes");
    expect(html).toContain("Restringido");
    expect(html).not.toContain('data-r02-action="availability"');
    expect(html).not.toContain('data-r02-action="appointment"');
    expect(html).not.toContain('data-r02-action="upload-knowledge"');
    expect(html).not.toContain('data-r02-action="agent-version"');
    expect(html).not.toContain('data-r02-action="handoff-target"');
  });

  it("neutralizes provider-looking persisted refs before rendering operator HTML", () => {
    const model = createR02OperationalDemoModel();
    const html = renderR02OperationalPage({
      ...model,
      appointments: [
        {
          appointmentId: "appointment-r02-google-dry-run",
          status: "scheduled",
          syncStatus: "pending",
          serviceTypeId: "consulta-general",
          startsAt: "2026-07-03T14:00:00.000Z",
        },
      ],
      handoffTargets: [
        {
          targetId: "twilio-fallback-demo",
          targetType: "twilio_fallback",
          displayName: "Twilio Fallback Demo",
          status: "disabled",
        },
      ],
    });

    expect(html).not.toMatch(/Google|Twilio|ElevenLabs|11labs|demo/iu);
    expect(html).toContain("cita-r02-externo-dry-run");
    expect(html).toContain("canal-fallback-operativo");
  });
});

function modelWithOperationalData() {
  const model = createR02OperationalDemoModel();
  return {
    ...model,
    appointments: [
      {
        appointmentId: "solicitud-cita-001",
        status: "scheduled",
        syncStatus: "pending",
        serviceTypeId: "orientacion-inicial",
        startsAt: "2026-07-03T14:00:00.000Z",
      },
    ],
    availability: [
      {
        slotId: "bloque-agenda-001",
        serviceTypeId: "orientacion-inicial",
        startsAt: "2026-07-03T14:00:00.000Z",
        capacityRemaining: 1,
      },
    ],
    knowledgeDocuments: [
      {
        documentId: "documento-operativo-001",
        status: "active",
        versionId: "documento-operativo-001-v1",
        sourceName: "servicios-cedco.md",
      },
    ],
    agents: [
      {
        agentId: "cedco-r02-recepcion-agendamiento",
        displayName: "CEDCO R02 Recepcion y Agendamiento",
        activeVersionId: "version-operativa-001",
        status: "active",
      },
    ],
    handoffTargets: [
      {
        targetId: "equipo-humano-cedco",
        targetType: "human",
        displayName: "Recepcion humana CEDCO",
        status: "active",
      },
    ],
    auditCount: 8,
  };
}
