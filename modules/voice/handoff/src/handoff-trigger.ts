export type HandoffTrigger =
  | "user_requested_human"
  | "urgent_case"
  | "low_confidence"
  | "policy_risk"
  | "repeated_failure"
  | "unknown_intent"
  | "manual_operator";
