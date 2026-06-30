export const roles = [
  "super-admin",
  "super_admin_hyperion",
  "tenant-admin",
  "cedco_admin",
  "r02_operator",
  "compliance_auditor",
  "reports_viewer",
  "integration_admin",
  "human_handoff_agent",
  "voice-manager",
  "voice-operator",
  "tenant-viewer",
  "auditor",
] as const;

export type Role = (typeof roles)[number];
