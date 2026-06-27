import { createOperationContext, type OperationContext } from "../../../shared/src/core";
import {
  createActorId,
  type ActorContext,
  type Role,
} from "../../../../modules/core/identity-access/src";

export interface TestContextInput {
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly roles?: readonly Role[];
  readonly correlationId?: string;
  readonly source?: string;
}

export function createTestOperationContext(input: TestContextInput = {}): OperationContext {
  const context = createOperationContext({
    tenantId: input.tenantId ?? "tenant-alpha",
    actorId: input.actorId ?? "actor-admin",
    correlationId: input.correlationId ?? "corr-test-001",
    source: input.source ?? "unit-test",
    occurredAt: new Date("2026-06-26T00:00:00.000Z"),
  });

  if (!context.ok) {
    throw new Error(context.error.message);
  }

  return context.value;
}

export function createTestActorContext(input: TestContextInput = {}): ActorContext {
  const actorId = createActorId(input.actorId ?? "actor-admin");
  if (!actorId.ok) {
    throw new Error(actorId.error.message);
  }

  return {
    actorId: actorId.value,
    tenantId: input.tenantId ?? "tenant-alpha",
    roles: input.roles ?? ["super-admin"],
  };
}
