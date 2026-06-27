import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";

export interface ProviderCallReference {
  readonly providerName: string;
  readonly providerCallId: string;
  readonly metadata: SafeMetadata;
}

export function createProviderCallReference(input: {
  readonly providerName: string;
  readonly providerCallId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): ProviderCallReference {
  return {
    providerName: input.providerName,
    providerCallId: input.providerCallId,
    metadata: sanitizeMetadata(input.metadata),
  };
}
