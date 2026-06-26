import {
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../core/audit/src/use-cases/record-audit-event";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import type { CallProviderConfig } from "../call-provider-config";
import type { CallProviderPort } from "../call-provider.port";
import { validateCallDispatchPolicy } from "../call-dispatch-policy";
import type { ContactResolverPort } from "../contact-resolver.port";
import type { OutboundCallLaunchRequest } from "../outbound-call-launch-request";
import type { OutboundCallLaunchResult } from "../outbound-call-launch-result";
import type { SipTrunkReadiness } from "../sip-trunk-readiness";

export interface DispatchOutboundCallInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly request: OutboundCallLaunchRequest;
  readonly provider: CallProviderPort;
  readonly contactResolver: ContactResolverPort;
  readonly providerConfig: CallProviderConfig;
  readonly sipTrunkReadiness?: SipTrunkReadiness;
  readonly realCallsEnabled: boolean;
  readonly humanApproved?: boolean;
  readonly optOut?: boolean;
  readonly auditLog?: AuditLogPort;
}

export async function dispatchOutboundCall(
  input: DispatchOutboundCallInput,
): Promise<Result<OutboundCallLaunchResult, DomainError>> {
  const policy = validateCallDispatchPolicy({
    actor: input.actor,
    realCallsEnabled: input.realCallsEnabled,
    providerConfig: input.providerConfig,
    sipTrunkReadiness: input.sipTrunkReadiness,
    humanApproved: input.humanApproved,
    optOut: input.optOut,
    allowFakeProvider: input.provider.providerKind === "fake",
  });
  if (!policy.ok) {
    return fail(policy.error);
  }

  const target = await input.contactResolver.resolveCalleeAlias(
    input.request.calleeAlias,
    input.context.tenantId,
  );
  const result = await input.provider.dispatchOutboundCall(input.request, target);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "voice.call.dispatched",
      resourceType: "call_session",
      resourceId: input.request.callId,
      result: result.accepted ? "success" : "failure",
      metadata: {
        providerName: input.provider.providerName,
        providerCallId: result.providerCallReference?.providerCallId ?? "none",
      },
    });
  }

  return ok(result);
}
