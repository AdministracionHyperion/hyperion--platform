import type { SpeechSegment } from "./speech-segment";

export interface SpeechTranscript {
  readonly transcriptId: string;
  readonly tenantId: string;
  readonly callId: string;
  readonly segments: readonly SpeechSegment[];
  readonly redacted: true;
}
