export const providerEventTypes = [
  "provider.mock.call.started",
  "provider.mock.call.ringing",
  "provider.mock.call.answered",
  "provider.mock.call.intent_detected",
  "provider.mock.call.completed",
  "provider.mock.call.failed",
  "provider.mock.post_call.available",
] as const;

export type ProviderEventType = (typeof providerEventTypes)[number];
