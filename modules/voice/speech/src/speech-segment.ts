export interface SpeechSegment {
  readonly segmentId: string;
  readonly textRedacted: string;
  readonly startedAtMs?: number;
  readonly endedAtMs?: number;
}
