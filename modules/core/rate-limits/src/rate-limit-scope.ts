export const rateLimitScopes = [
  "tenant",
  "actor",
  "route",
  "tenant_actor",
  "tenant_route",
  "actor_route",
] as const;

export type RateLimitScope = (typeof rateLimitScopes)[number];
