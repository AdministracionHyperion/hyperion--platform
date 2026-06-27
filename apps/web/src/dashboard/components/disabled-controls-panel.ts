import { escapeHtml } from "./utils";

const disabledControls = [
  "Real call dispatch",
  "Provider egress",
  "Production deploy",
  "Raw text export",
  "Audio recording access",
  "Data export",
] as const;

export function renderDisabledControlsPanel(): string {
  return `<section class="panel disabled-controls">
    <h2>Future controls</h2>
    <p>Blocked by policy gates. Mock-only environment. Requires future approval, runbook, credential manager and provider configuration.</p>
    <div class="disabled-controls__grid">
      ${disabledControls
        .map(
          (label) =>
            `<button type="button" disabled aria-disabled="true">${escapeHtml(label)}</button>`,
        )
        .join("")}
    </div>
  </section>`;
}
