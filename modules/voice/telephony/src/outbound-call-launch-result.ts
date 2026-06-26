import type { ProviderCallReference } from "./provider-call-reference";

export interface OutboundCallLaunchResult {
  readonly accepted: boolean;
  readonly providerCallReference?: ProviderCallReference;
  readonly message?: string;
}
