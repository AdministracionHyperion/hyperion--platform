import { describe, expect, it } from "vitest";
import { createR02OperationalDemoModel, renderR02OperationalPage } from "../r02-operational-page";

describe("CEDCO R02 operational page", () => {
  it("renders calendar, RAG, agents, handoff and integration status", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());
    expect(html).toContain("CEDCO R02 Operations");
    expect(html).toContain("Calendario y citas");
    expect(html).toContain("Knowledge base");
    expect(html).toContain("Agentes");
    expect(html).toContain("Integraciones");
    expect(html).toContain("disabled");
  });

  it("does not render sensitive payload or active real-call controls", () => {
    const html = renderR02OperationalPage(createR02OperationalDemoModel());
    expect(html).not.toMatch(/phoneNumber|rawTranscript|audioUrl|recordingUrl|token|secret/iu);
    expect(html).not.toMatch(/onclick|fetch|dispatch\s*\(/iu);
  });
});
