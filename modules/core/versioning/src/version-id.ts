import { createCorrelationId, type Brand } from "../../../../packages/shared/src/core";

export type VersionId = Brand<string, "VersionId">;

export function createVersionId(): VersionId {
  const correlationId = createCorrelationId();
  return (correlationId.ok ? `ver-${correlationId.value}` : `ver-${Date.now()}`) as VersionId;
}
