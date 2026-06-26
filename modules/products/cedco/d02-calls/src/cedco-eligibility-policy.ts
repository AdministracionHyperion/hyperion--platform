import { ok, type Result } from "../../../../../packages/shared/src/core";
import type { CedcoD02Configuration } from "./cedco-d02-configuration";

export function evaluateCedcoEligibilityPolicy(
  configuration: CedcoD02Configuration,
): Result<"unknown" | "eligible" | "integration_required", never> {
  if (configuration.eligibilityMode === "disabled") {
    return ok("unknown");
  }

  if (configuration.eligibilityMode === "mock") {
    return ok("eligible");
  }

  return ok("integration_required");
}
