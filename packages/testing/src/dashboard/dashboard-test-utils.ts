export function assertNoDashboardSensitiveText(rendered: string): void {
  if (/phoneNumber|rawTranscript|audioUrl|recordingUrl|token|secret|rawPayload/iu.test(rendered)) {
    throw new Error("Dashboard rendered sensitive text.");
  }
}
