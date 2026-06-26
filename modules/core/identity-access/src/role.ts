export const roles = [
  "super-admin",
  "tenant-admin",
  "voice-manager",
  "voice-operator",
  "tenant-viewer",
  "auditor",
] as const;

export type Role = (typeof roles)[number];
