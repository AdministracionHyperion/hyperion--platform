import {
  domainError,
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type CedcoSiteId = Brand<string, "CedcoSiteId">;

export const initialCedcoSiteIds = ["bucaramanga", "piedecuesta", "barrancabermeja"] as const;

export function createCedcoSiteId(value: string): Result<CedcoSiteId, DomainError> {
  const validated = validateSafeIdentifier(value, "cedcoSiteId");
  if (!validated.ok) {
    return fail(validated.error);
  }

  if (!initialCedcoSiteIds.includes(validated.value as (typeof initialCedcoSiteIds)[number])) {
    return fail(
      domainError("invalid_id", "cedcoSiteId is not in the initial CEDCO site allowlist"),
    );
  }

  return ok(validated.value as CedcoSiteId);
}
