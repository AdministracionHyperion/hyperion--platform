export interface TranscriptPolicy {
  readonly rawTranscriptEnabled: false;
  readonly redactedTranscriptAllowed: boolean;
  readonly retentionDays: number;
}

export const defaultTranscriptPolicy: TranscriptPolicy = {
  rawTranscriptEnabled: false,
  redactedTranscriptAllowed: true,
  retentionDays: 30,
};
