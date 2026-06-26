import type { Brand } from "../../../../packages/shared/src/core";
import type { PromptId } from "./prompt-id";
import type { PromptPolicy } from "./prompt-policy";
import type { PromptVariable } from "./prompt-variable";

export type PromptVersionId = Brand<string, "PromptVersionId">;
export type PromptVersionStatus = "draft" | "active" | "archived";

export interface PromptVersion {
  readonly promptVersionId: PromptVersionId;
  readonly tenantId: string;
  readonly promptId: PromptId;
  readonly versionNumber: number;
  readonly status: PromptVersionStatus;
  readonly template: string;
  readonly variables: readonly PromptVariable[];
  readonly policy: PromptPolicy;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
}
