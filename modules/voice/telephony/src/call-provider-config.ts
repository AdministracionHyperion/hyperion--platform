export type CallProviderKind = "fake" | "managed_voice_runtime" | "sip_trunk" | "future_gateway";

export interface CallProviderConfig {
  readonly providerName: string;
  readonly providerKind: CallProviderKind;
  readonly configured: boolean;
}
