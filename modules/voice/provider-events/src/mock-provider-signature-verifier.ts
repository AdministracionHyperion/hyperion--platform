import { fail, ok, type DomainError, type Result } from "../../../../packages/shared/src/core";
import {
  type ProviderEventSignatureResult,
  type ProviderEventSignatureVerifierInput,
  type ProviderEventSignatureVerifierPort,
} from "./provider-event-signature-verifier.port";
import { providerEventValidationError } from "./provider-event-error";

export interface MockProviderSignatureVerifierOptions {
  readonly allowUnsignedForUnitTests?: boolean;
}

export class MockProviderSignatureVerifier implements ProviderEventSignatureVerifierPort {
  constructor(private readonly options: MockProviderSignatureVerifierOptions = {}) {}

  verify(
    input: ProviderEventSignatureVerifierInput,
  ): Result<ProviderEventSignatureResult, DomainError> {
    const signature = findHeader(input.headers, "x-hyperion-mock-signature");
    if (!signature && this.options.allowUnsignedForUnitTests) {
      return ok({ verified: true, reason: "unit_test_unsigned_allowed" });
    }
    if (!signature) {
      return fail(providerEventValidationError("mock provider event signature is required"));
    }
    if (signature !== "mock_valid_signature") {
      return fail(providerEventValidationError("mock provider event signature is invalid"));
    }
    return ok({ verified: true });
  }
}

function findHeader(headers: Readonly<Record<string, unknown>>, name: string): string | undefined {
  const exact = headers[name];
  if (typeof exact === "string") {
    return exact;
  }
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName && typeof value === "string") {
      return value;
    }
  }
  return undefined;
}
