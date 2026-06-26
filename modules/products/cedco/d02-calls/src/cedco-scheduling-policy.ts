import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CedcoD02Configuration } from "./cedco-d02-configuration";
import type { CedcoSchedulingPort } from "./cedco-scheduling.port";

export function evaluateCedcoSchedulingPolicy(input: {
  readonly configuration: CedcoD02Configuration;
  readonly schedulingPort?: CedcoSchedulingPort;
}): Result<"oriented" | "mock_confirmed" | "integration_required", DomainError> {
  if (input.configuration.schedulingMode === "disabled") {
    return ok("oriented");
  }

  if (input.configuration.schedulingMode === "mock") {
    return ok("mock_confirmed");
  }

  if (!input.schedulingPort) {
    return ok("integration_required");
  }

  return fail(domainError("invalid_state", "real scheduling integration is out of scope"));
}
