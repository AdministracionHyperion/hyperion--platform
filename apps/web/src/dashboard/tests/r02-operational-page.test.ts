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
});
