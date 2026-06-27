import type { DomainError, Result } from "../../../../packages/shared/src/core";
import { fail, ok } from "../../../../packages/shared/src/core";
import type { ProviderEventSource } from "./provider-event-source";
import type { ProviderEventType } from "./provider-event-type";
import { findForbiddenProviderEventKey } from "./post-call-event-sanitizer";
import { providerEventValidationError } from "./provider-event-error";

export interface ProviderEventPolicyInput {
  readonly source: ProviderEventSource;
  readonly type: ProviderEventType;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly providerCallRef: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export function evaluateProviderEventPolicy(
  input: ProviderEventPolicyInput,
): Result<true, DomainError> {
  if (input.source !== "mock") {
    return fail(providerEventValidationError("only mock provider events are allowed in this loop"));
  }
  if (!input.type.startsWith("provider.mock.")) {
    return fail(providerEventValidationError("only provider.mock event types are allowed"));
  }
  if (!input.tenantId || !input.correlationId) {
    return fail(providerEventValidationError("tenantId and correlationId are required"));
  }
  if (!input.providerCallRef.startsWith("mock_call_")) {
    return fail(providerEventValidationError("providerCallRef must use the mock_call_ prefix"));
  }
  if (findForbiddenProviderEventKey(input.payload)) {
    return fail(providerEventValidationError("provider event payload contains forbidden data"));
  }
  if (hasRealRuntimeFlag(input.payload)) {
    return fail(
      providerEventValidationError("provider event payload tries to enable real runtime"),
    );
  }
  return ok(true);
}

function hasRealRuntimeFlag(payload: Readonly<Record<string, unknown>>): boolean {
  return [
    "runtimeMode",
    "realCallsEnabled",
    "providerEgressEnabled",
    "productionDeployEnabled",
    "rawTranscriptEnabled",
    "rawRecordingEnabled",
  ].some((key) => {
    const value = payload[key];
    return value === true || value === "real";
  });
}
