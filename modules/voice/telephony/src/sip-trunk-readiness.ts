import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";

export interface SipTrunkReadiness {
  readonly providerName: string;
  readonly trunkAlias: string;
  readonly outboundEnabled: boolean;
  readonly tlsRequired: boolean;
  readonly mediaEncryptionPreferred: boolean;
  readonly codecAllowlist: readonly string[];
  readonly verified: boolean;
  readonly metadata: SafeMetadata;
}

export function createSipTrunkReadiness(
  input: Omit<SipTrunkReadiness, "metadata"> & {
    readonly metadata?: Readonly<Record<string, unknown>>;
  },
): SipTrunkReadiness {
  return {
    ...input,
    metadata: sanitizeMetadata(input.metadata),
  };
}
