export interface RecordingPolicy {
  readonly rawRecordingEnabled: false;
  readonly rawRecordingUrlAllowed: false;
  readonly consentRequired: boolean;
  readonly retentionDays: number;
}

export const defaultRecordingPolicy: RecordingPolicy = {
  rawRecordingEnabled: false,
  rawRecordingUrlAllowed: false,
  consentRequired: true,
  retentionDays: 0,
};
