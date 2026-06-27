import type { DialerDispatchRequest } from "../../../../../modules/integrations/provider-adapters/internal-dialer/src";

export function createSafeInternalDialerRequest(
  input: Partial<DialerDispatchRequest> = {},
): DialerDispatchRequest {
  return {
    externalRequestId: "dialer-request-test-001",
    tenantId: "cedco-test",
    mode: "single",
    runtimeMode: "dry_run",
    safeContactRef: "safe-contact-ref-test",
    agentAlias: "cedco-agent-alias",
    callerAlias: "cedco-caller-alias",
    dynamicVars: { service: "orientation" },
    consent: { granted: true, consentRef: "consent-ref-test" },
    callback: { internalEventTopic: "internal.events.dialer.test" },
    metadata: { source: "unit-test" },
    ...input,
  };
}

export function createUnsafeInternalDialerRequest(): DialerDispatchRequest {
  return createSafeInternalDialerRequest({
    metadata: { phoneNumber: "+15555550123" },
  });
}
