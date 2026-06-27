export const unsafeProviderEventPayloads = {
  phoneNumber: { metadata: { phoneNumber: "+570000000000" } },
  rawTranscript: { metadata: { rawTranscript: "blocked transcript" } },
  audioUrl: { metadata: { audioUrl: "https://example.invalid/audio.wav" } },
  credential: { metadata: { ["token"]: "redacted" } },
  rawPayload: { metadata: { rawPayload: { nested: true } } },
} as const;
