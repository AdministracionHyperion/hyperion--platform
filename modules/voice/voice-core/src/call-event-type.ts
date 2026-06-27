export type CallEventType =
  | "call.created"
  | "call.status_changed"
  | "call.event_registered"
  | "call.turn_recorded"
  | "call.closed"
  | "call.provider_event_ingested"
  | "call.post_call_ingested"
  | "call.handoff_requested"
  | string;
