import type { DomainError, Result } from "../../../../packages/shared/src/core";

export interface ProviderEventSignatureVerifierInput {
  readonly headers: Readonly<Record<string, unknown>>;
  readonly eventId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface ProviderEventSignatureResult {
  readonly verified: boolean;
  readonly reason?: string;
}

export interface ProviderEventSignatureVerifierPort {
  verify(
    input: ProviderEventSignatureVerifierInput,
  ): Result<ProviderEventSignatureResult, DomainError>;
}
