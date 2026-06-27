import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CallRuntimeRef } from "../../../call-orchestration/src/call-runtime-ref";
import type { CallId } from "../../../voice-core/src/call-id";
import { validateVoiceMetadataKeys } from "../../../voice-core/src/call-data-policy";
import { createCalleeAlias } from "../callee-alias";
import { createCallerAlias } from "../caller-alias";
import type { OutboundCallLaunchRequest } from "../outbound-call-launch-request";

export interface PrepareOutboundCallLaunchInput {
  readonly context: OperationContext;
  readonly callId: CallId;
  readonly calleeAlias: string;
  readonly callerAlias: string;
  readonly agentRuntimeRef?: CallRuntimeRef;
  readonly campaignRef?: string;
  readonly purpose: string;
  readonly scheduledWindow?: { readonly startsAt: Date; readonly endsAt: Date };
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function prepareOutboundCallLaunch(
  input: PrepareOutboundCallLaunchInput,
): Result<OutboundCallLaunchRequest, DomainError> {
  const metadataValidation = validateVoiceMetadataKeys(input.metadata);
  if (!metadataValidation.ok) {
    return fail(metadataValidation.error);
  }

  const calleeAlias = createCalleeAlias(input.calleeAlias);
  if (!calleeAlias.ok) {
    return fail(calleeAlias.error);
  }

  const callerAlias = createCallerAlias(input.callerAlias);
  if (!callerAlias.ok) {
    return fail(callerAlias.error);
  }

  if (input.purpose.trim().length === 0) {
    return fail(domainError("invalid_state", "outbound call purpose is required"));
  }

  return ok({
    tenantId: input.context.tenantId,
    callId: input.callId,
    calleeAlias: calleeAlias.value,
    callerAlias: callerAlias.value,
    agentRuntimeRef: input.agentRuntimeRef,
    campaignRef: input.campaignRef,
    purpose: input.purpose,
    scheduledWindow: input.scheduledWindow,
    metadata: sanitizeMetadata(input.metadata),
  });
}
