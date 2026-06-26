import type { SpeechSynthesisRequest } from "../../../../modules/voice/speech/src/speech-synthesis-request";
import type { SpeechSynthesisResult } from "../../../../modules/voice/speech/src/speech-synthesis-result";
import type { TextToSpeechPort } from "../../../../modules/voice/speech/src/text-to-speech.port";

export class FakeTextToSpeech implements TextToSpeechPort {
  async synthesize(input: SpeechSynthesisRequest): Promise<SpeechSynthesisResult> {
    return {
      audioRef: `synthetic-audio-${input.tenantId}`,
      durationMs: input.textRedacted.length * 10,
      synthetic: true,
    };
  }
}
