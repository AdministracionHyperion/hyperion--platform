import type { PromptId } from "../../../../modules/agent-platform/prompt-management/src/prompt-id";
import type {
  PromptVersion,
  PromptVersionId,
} from "../../../../modules/agent-platform/prompt-management/src/prompt-version";
import type { PromptVersionRepositoryPort } from "../../../../modules/agent-platform/prompt-management/src/prompt-version-repository.port";

export class InMemoryPromptVersionRepository implements PromptVersionRepositoryPort {
  private readonly versions = new Map<string, PromptVersion>();

  async save(version: PromptVersion): Promise<void> {
    this.versions.set(key(version.tenantId, version.promptVersionId), version);
  }

  async findById(
    tenantId: string,
    promptVersionId: PromptVersionId,
  ): Promise<PromptVersion | null> {
    return this.versions.get(key(tenantId, promptVersionId)) ?? null;
  }

  async findByPrompt(tenantId: string, promptId: PromptId): Promise<readonly PromptVersion[]> {
    return [...this.versions.values()].filter(
      (version) => version.tenantId === tenantId && version.promptId === promptId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
