import { describe, expect, it } from "vitest";
import { createR02OperationalDemoModel, renderR02OperationalPage } from "../r02-operational-page";

describe("CEDCO R02 operational page", () => {
  it("renders calendar, RAG, agents, handoff and integration status", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());
    expect(html).toContain("CEDCO R02 Operations");
    expect(html).toContain("Calendario y citas");
    expect(html).toContain("RAG / Knowledge base");
    expect(html).toContain('data-r02-action="upload-knowledge"');
    expect(html).toContain("data-r02-local-text-file");
    expect(html).toContain('accept=".txt,.md,.csv,.json');
    expect(html).toContain("Cargar RAG");
    expect(html).toContain('data-r02-action="google-sync-dry-run"');
    expect(html).toContain("Validar Google dry-run");
    expect(html).toContain("Agentes");
    expect(html).toContain("Handoff");
    expect(html).toContain("Integraciones");
    expect(html).toContain("Inputs y gates finales");
    expect(html).toContain("APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING");
    expect(html).toContain("Documentos CEDCO sanitizados");
    expect(html).toContain("disabled");
  });

  it("renders internal operator actions without sensitive payload or real-call controls", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());
    expect(html).not.toMatch(/phoneNumber|rawTranscript|audioUrl|recordingUrl|token|secret/iu);
    expect(html).toContain("fetch(apiBase");
    expect(html).not.toMatch(/outbound-call|dispatch\s*\(|providerMutation:\s*true/iu);
    expect(html).not.toMatch(/accept="[^"]*pdf|accept="[^"]*docx/iu);
  });
});
