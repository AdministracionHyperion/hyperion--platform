export type CallProviderEventType =
  | "provider.call.prepared"
  | "provider.call.dispatched"
  | "provider.call.ringing"
  | "provider.call.in_progress"
  | "provider.call.completed"
  | "provider.call.failed"
  | "provider.post_call.received"
  | string;
