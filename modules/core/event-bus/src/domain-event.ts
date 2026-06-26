import type { SafeMetadata } from "../../../../packages/shared/src/core";

export interface DomainEvent<TPayload = SafeMetadata> {
  readonly type: string;
  readonly payload: TPayload;
  readonly occurredAt: Date;
}
