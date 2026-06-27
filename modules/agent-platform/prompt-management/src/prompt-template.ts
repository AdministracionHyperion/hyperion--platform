import type { PromptId } from "./prompt-id";
import type { PromptScope } from "./prompt-scope";

export interface PromptTemplate {
  readonly promptId: PromptId;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly scope: PromptScope;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
