import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CedcoD02Configuration } from "./cedco-d02-configuration";

export function validateCedcoKnowledgePolicy(input: {
  readonly configuration: CedcoD02Configuration;
  readonly requiresKnowledge: boolean;
  readonly knownSite?: boolean;
  readonly knownService?: boolean;
  readonly knownAgreement?: boolean;
}): Result<true, DomainError> {
  if (input.requiresKnowledge && !input.configuration.activeKnowledgeBaseVersionId) {
    return fail(domainError("invalid_state", "active KnowledgeBaseVersion is required"));
  }

  if (input.knownSite === false || input.knownService === false || input.knownAgreement === false) {
    return fail(domainError("invalid_state", "CEDCO knowledge must not be invented"));
  }

  return ok(true);
}
