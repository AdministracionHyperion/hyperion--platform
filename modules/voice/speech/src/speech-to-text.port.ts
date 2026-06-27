import type { SpeechTranscript } from "./speech-transcript";

export interface SpeechToTextPort {
  transcribeRedacted(input: {
    readonly tenantId: string;
    readonly callId: string;
    readonly audioRef: string;
  }): Promise<SpeechTranscript>;
}
