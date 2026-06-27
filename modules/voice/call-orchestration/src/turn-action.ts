export type TurnAction =
  | "respond"
  | "ask_clarifying_question"
  | "invoke_tool"
  | "handoff"
  | "end_call"
  | "fail_safe";
