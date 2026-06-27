import { createProviderCallReference } from "../../../../modules/voice/telephony/src/provider-call-reference";
import type { CallProviderEvent } from "../../../../modules/voice/telephony/src/call-provider-event";
import type { CallProviderPort } from "../../../../modules/voice/telephony/src/call-provider.port";
import type {
  OutboundCallLaunchRequest,
  RuntimeContactTarget,
} from "../../../../modules/voice/telephony/src/outbound-call-launch-request";
import type { OutboundCallLaunchResult } from "../../../../modules/voice/telephony/src/outbound-call-launch-result";
import type { PostCallWebhookEnvelope } from "../../../../modules/voice/telephony/src/post-call-webhook-envelope";

export class FakeCallProvider implements CallProviderPort {
  readonly providerName = "fake-call-provider";
  readonly providerKind = "fake";
  readonly runtimeTargets: RuntimeContactTarget[] = [];

  async prepareOutboundCall(request: OutboundCallLaunchRequest): Promise<OutboundCallLaunchResult> {
    return {
      accepted: true,
      providerCallReference: createProviderCallReference({
        providerName: this.providerName,
        providerCallId: `fake-prepared-${request.callId}`,
      }),
    };
  }

  async dispatchOutboundCall(
    request: OutboundCallLaunchRequest,
    runtimeContactTarget: RuntimeContactTarget,
  ): Promise<OutboundCallLaunchResult> {
    this.runtimeTargets.push(runtimeContactTarget);
    return {
      accepted: true,
      providerCallReference: createProviderCallReference({
        providerName: this.providerName,
        providerCallId: `fake-dispatched-${request.callId}`,
        metadata: { calleeAlias: request.calleeAlias },
      }),
    };
  }

  async cancelOutboundCall(providerCallId: string): Promise<OutboundCallLaunchResult> {
    return { accepted: true, message: `cancelled ${providerCallId}` };
  }

  async ingestProviderEvent(event: CallProviderEvent): Promise<CallProviderEvent> {
    return event;
  }

  async ingestPostCallWebhook(envelope: PostCallWebhookEnvelope): Promise<PostCallWebhookEnvelope> {
    return envelope;
  }
}
