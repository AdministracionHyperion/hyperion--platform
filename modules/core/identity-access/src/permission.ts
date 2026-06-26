export const permissions = [
  "platform:tenant:create",
  "tenant:read",
  "tenant:update",
  "agent:read",
  "agent:write",
  "voice:call:read",
  "voice:call:write",
  "voice:call:dispatch",
  "voice:handoff:manage",
  "audit:read",
  "feedback:read",
  "feedback:write",
  "version:read",
  "version:write",
  "version:activate",
] as const;

export type Permission = (typeof permissions)[number];
