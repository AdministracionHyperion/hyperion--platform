export interface HandoffSummary {
  readonly redactedSummary: string;
}

export function containsRawTranscriptRisk(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("rawtranscript") ||
    lower.includes("raw transcript") ||
    lower.includes("recordingurl") ||
    lower.includes("audiourl")
  );
}
