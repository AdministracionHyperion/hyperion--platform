import type { Permission } from "./permission";
import type { Role } from "./role";

const allPermissions: readonly Permission[] = [
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
];

const rolePermissions: Readonly<Record<Exclude<Role, "super-admin">, readonly Permission[]>> = {
  "tenant-admin": [
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
  ],
  "voice-manager": [
    "agent:read",
    "agent:write",
    "voice:call:read",
    "voice:call:write",
    "voice:call:dispatch",
    "voice:handoff:manage",
    "feedback:read",
    "feedback:write",
    "version:read",
    "version:write",
  ],
  "voice-operator": [
    "voice:call:read",
    "voice:call:write",
    "voice:call:dispatch",
    "voice:handoff:manage",
    "feedback:write",
  ],
  "tenant-viewer": [
    "tenant:read",
    "agent:read",
    "voice:call:read",
    "feedback:read",
    "version:read",
  ],
  auditor: [
    "tenant:read",
    "agent:read",
    "voice:call:read",
    "audit:read",
    "feedback:read",
    "version:read",
  ],
};

export function roleAllows(role: Role, permission: Permission): boolean {
  if (role === "super-admin") {
    return allPermissions.includes(permission);
  }

  return rolePermissions[role].includes(permission);
}

export function rolesAllow(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => roleAllows(role, permission));
}
