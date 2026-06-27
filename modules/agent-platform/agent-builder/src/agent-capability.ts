export type AgentCapability =
  | "conversation.context"
  | "prompt.render"
  | "flow.execute"
  | "knowledge.retrieve"
  | "handoff.request"
  | "feedback.record";

export function hasWildcardCapability(capabilities: readonly string[]): boolean {
  return capabilities.some((capability) => capability === "*" || capability.trim() === "");
}
