import type { RateLimitRule } from "./rate-limit-rule";

const unsafeKeyPartPattern = /[^a-zA-Z0-9:._/-]/gu;

export interface RateLimitKeyInput {
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly route: string;
  readonly method: string;
  readonly rule: RateLimitRule;
}

export function createRateLimitKey(input: RateLimitKeyInput): string {
  const parts = [input.rule.scope, input.method.toUpperCase()];

  if (input.rule.scope.includes("tenant")) {
    parts.push(input.tenantId ?? "public");
  }
  if (input.rule.scope.includes("actor")) {
    parts.push(input.actorId ?? "anonymous");
  }
  if (input.rule.scope.includes("route")) {
    parts.push(input.route);
  }

  if (input.rule.scope === "tenant") {
    parts.push(input.tenantId ?? "public");
  }
  if (input.rule.scope === "actor") {
    parts.push(input.actorId ?? "anonymous");
  }
  if (input.rule.scope === "route") {
    parts.push(input.route);
  }

  return parts.map(sanitizeKeyPart).join(":");
}

function sanitizeKeyPart(value: string): string {
  return value.trim().replace(unsafeKeyPartPattern, "_").slice(0, 160);
}
