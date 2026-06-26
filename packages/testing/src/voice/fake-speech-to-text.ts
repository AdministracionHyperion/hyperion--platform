import type { SpeechToTextPort } from "../../../../modules/voice/speech/src/speech-to-text.port";
import type { SpeechTranscript } from "../../../../modules/voice/speech/src/speech-transcript";

export class FakeSpeechToText implements SpeechToTextPort {
  async transcribeRedacted(input: {
    readonly tenantId: string;
    readonly callId: string;
    readonly audioRef: string;
  }): Promise<SpeechTranscript> {
    return {
      transcriptId: `fake-transcript-${input.callId}`,
      tenantId: input.tenantId,
      callId: input.callId,
      segments: [{ segmentId: "segment-001", textRedacted: "synthetic redacted transcript" }],
      redacted: true,
    };
  }
}
