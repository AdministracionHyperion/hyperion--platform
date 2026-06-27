export type CallStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "queued"
  | "dispatching"
  | "sent_to_provider"
  | "ringing"
  | "in_progress"
  | "voicemail"
  | "completed"
  | "handoff"
  | "failed"
  | "blocked"
  | "cancelled"
  | "post_call_pending"
  | "post_call_ingested"
  | "reviewed";

export const terminalCallStatuses: readonly CallStatus[] = ["cancelled", "reviewed", "blocked"];

const allowedTransitions: Readonly<Record<CallStatus, readonly CallStatus[]>> = {
  draft: ["awaiting_approval"],
  awaiting_approval: ["approved"],
  approved: ["scheduled", "queued"],
  scheduled: ["queued"],
  queued: ["dispatching"],
  dispatching: ["sent_to_provider"],
  sent_to_provider: ["ringing", "failed"],
  ringing: ["in_progress", "voicemail", "failed"],
  in_progress: ["completed", "handoff", "failed"],
  voicemail: ["post_call_pending"],
  completed: ["post_call_pending"],
  handoff: ["post_call_pending"],
  failed: ["post_call_pending"],
  post_call_pending: ["post_call_ingested"],
  post_call_ingested: ["reviewed"],
  cancelled: [],
  reviewed: [],
  blocked: [],
};

export function canTransitionCallStatus(from: CallStatus, to: CallStatus): boolean {
  return allowedTransitions[from].includes(to);
}
