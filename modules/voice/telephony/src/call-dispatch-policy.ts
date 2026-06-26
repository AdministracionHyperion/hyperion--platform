import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";
import type { ActorContext } from "../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../core/identity-access/src/rbac-policy";
import type { CallProviderConfig } from "./call-provider-config";
import type { SipTrunkReadiness } from "./sip-trunk-readiness";

export interface CallDispatchPolicyInput {
  readonly actor: ActorContext;
  readonly realCallsEnabled: boolean;
  readonly providerConfig: CallProviderConfig;
  readonly sipTrunkReadiness?: SipTrunkReadiness;
  readonly humanApproved?: boolean;
  readonly optOut?: boolean;
  readonly allowFakeProvider?: boolean;
}

export function validateCallDispatchPolicy(
  input: CallDispatchPolicyInput,
): Result<true, DomainError> {
  if (!rolesAllow(input.actor.roles, "voice:call:dispatch")) {
    return fail(domainError("forbidden", "actor cannot dispatch calls"));
  }

  if (input.optOut === true) {
    return fail(domainError("invalid_state", "callee is opted out"));
  }

  if (input.humanApproved === false) {
    return fail(domainError("invalid_state", "human approval is required"));
  }

  if (!input.providerConfig.configured) {
    return fail(domainError("invalid_state", "provider is not configured"));
  }

  if (
    !input.realCallsEnabled &&
    !(input.allowFakeProvider && input.providerConfig.providerKind === "fake")
  ) {
    return fail(domainError("invalid_state", "real calls are disabled"));
  }

  if (input.providerConfig.providerKind !== "fake" && input.sipTrunkReadiness?.verified !== true) {
    return fail(domainError("invalid_state", "sip trunk is not verified"));
  }

  return ok(true);
}
