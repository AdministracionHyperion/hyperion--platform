export interface SpeechSynthesisResult {
  readonly audioRef: string;
  readonly durationMs?: number;
  readonly synthetic: boolean;
}
