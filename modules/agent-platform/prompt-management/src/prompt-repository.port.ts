import type { PromptId } from "./prompt-id";
import type { PromptTemplate } from "./prompt-template";

export interface PromptRepositoryPort {
  save(template: PromptTemplate): Promise<void>;
  findById(tenantId: string, promptId: PromptId): Promise<PromptTemplate | null>;
}
