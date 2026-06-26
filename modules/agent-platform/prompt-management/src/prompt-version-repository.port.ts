import type { PromptId } from "./prompt-id";
import type { PromptVersion, PromptVersionId } from "./prompt-version";

export interface PromptVersionRepositoryPort {
  save(version: PromptVersion): Promise<void>;
  findById(tenantId: string, promptVersionId: PromptVersionId): Promise<PromptVersion | null>;
  findByPrompt(tenantId: string, promptId: PromptId): Promise<readonly PromptVersion[]>;
}
