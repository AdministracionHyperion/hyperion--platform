import { describe, expect, it } from "vitest";
import { createR02OperationalDemoModel, renderR02OperationalPage } from "../r02-operational-page";

describe("CEDCO R02 operational page", () => {
  it("renders calendar, knowledge, assistant, handoff and neutral channel status", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());
    expect(html).toContain("Centro operativo CEDCO");
    expect(html).toContain("Calendario y citas");
    expect(html).toContain("Base de conocimiento");
    expect(html).toContain('data-r02-action="upload-knowledge"');
    expect(html).toContain("data-r02-local-text-file");
    expect(html).toContain('accept=".txt,.md,.csv,.json');
    expect(html).toContain("Cargar documento");
    expect(html).toContain('data-r02-action="external-calendar-sync-dry-run"');
    expect(html).toContain("Validar calendario externo");
    expect(html).toContain("Asistente");
    expect(html).toContain("Derivaciones");
    expect(html).toContain("Estado de canales");
    expect(html).toContain("Preparacion y pendientes");
    expect(html).toContain("Conectar calendario externo de staging");
    expect(html).toContain("Documentos CEDCO sanitizados");
    expect(html).toContain("disabled");
    expect(html).not.toMatch(
      /Google|Twilio|ElevenLabs|11labs|Knowledge base|Egress provider|Transcript\/audio/iu,
    );
  });

  it("renders internal operator actions without sensitive payload or real-call controls", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());
    expect(html).not.toMatch(/phoneNumber|rawTranscript|audioUrl|recordingUrl|token|secret/iu);
    expect(html).toContain("fetch(apiBase");
    expect(html).not.toMatch(/outbound-call|dispatch\s*\(|externalMutation:\s*true/iu);
    expect(html).not.toMatch(/accept="[^"]*pdf|accept="[^"]*docx/iu);
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

    expect(html).not.toMatch(/Google|Twilio|ElevenLabs|11labs/iu);
    expect(html).toContain("appointment-r02-externo-dry-run");
    expect(html).toContain("canal-fallback-demo");
  });
});
