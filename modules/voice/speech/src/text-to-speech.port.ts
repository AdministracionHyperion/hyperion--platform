import type { SpeechSynthesisRequest } from "./speech-synthesis-request";
import type { SpeechSynthesisResult } from "./speech-synthesis-result";

export interface TextToSpeechPort {
  synthesize(input: SpeechSynthesisRequest): Promise<SpeechSynthesisResult>;
}
