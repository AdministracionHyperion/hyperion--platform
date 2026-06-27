import type { CallProviderEvent } from "./call-provider-event";
import type {
  OutboundCallLaunchRequest,
  RuntimeContactTarget,
} from "./outbound-call-launch-request";
import type { OutboundCallLaunchResult } from "./outbound-call-launch-result";
import type { PostCallWebhookEnvelope } from "./post-call-webhook-envelope";

export interface CallProviderPort {
  readonly providerName: string;
  readonly providerKind: "fake" | "managed_voice_runtime" | "sip_trunk" | "future_gateway";
  prepareOutboundCall(request: OutboundCallLaunchRequest): Promise<OutboundCallLaunchResult>;
  dispatchOutboundCall(
    request: OutboundCallLaunchRequest,
    runtimeContactTarget: RuntimeContactTarget,
  ): Promise<OutboundCallLaunchResult>;
  cancelOutboundCall(providerCallId: string): Promise<OutboundCallLaunchResult>;
  ingestProviderEvent(event: CallProviderEvent): Promise<CallProviderEvent>;
  ingestPostCallWebhook(envelope: PostCallWebhookEnvelope): Promise<PostCallWebhookEnvelope>;
}
