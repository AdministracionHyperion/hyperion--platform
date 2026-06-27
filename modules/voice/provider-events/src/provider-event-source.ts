export const providerEventSources = [
  "mock",
  "future_elevenlabs",
  "future_sip",
  "future_pbx",
] as const;

export type ProviderEventSource = (typeof providerEventSources)[number];
