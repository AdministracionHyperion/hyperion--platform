import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { KnowledgeChunk } from "../knowledge-chunk";
import type { RetrievalProviderPort } from "../retrieval-provider.port";
import { defaultRetrievalPolicy, type RetrievalPolicy } from "../retrieval-policy";

export interface RetrieveKnowledgeContextInput {
  readonly context: OperationContext;
  readonly provider: RetrievalProviderPort;
  readonly query: string;
  readonly tenantId: string;
  readonly policy?: RetrievalPolicy;
}

export async function retrieveKnowledgeContext(
  input: RetrieveKnowledgeContextInput,
): Promise<Result<readonly KnowledgeChunk[], DomainError>> {
  if (input.tenantId !== input.context.tenantId) {
    return fail(domainError("tenant_isolation_violation", "cross-tenant retrieval is not allowed"));
  }

  const policy = input.policy ?? defaultRetrievalPolicy;
  if (policy.allowCrossTenant !== false) {
    return fail(
      domainError(
        "tenant_isolation_violation",
        "retrieval policy cannot allow cross-tenant access",
      ),
    );
  }

  const chunks = await input.provider.retrieve({
    tenantId: input.context.tenantId,
    query: input.query,
    policy,
  });

  return ok(chunks.filter((chunk) => chunk.tenantId === input.context.tenantId));
}
