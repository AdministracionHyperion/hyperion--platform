import type { PromptId } from "../../../../modules/agent-platform/prompt-management/src/prompt-id";
import type { PromptRepositoryPort } from "../../../../modules/agent-platform/prompt-management/src/prompt-repository.port";
import type { PromptTemplate } from "../../../../modules/agent-platform/prompt-management/src/prompt-template";

export class InMemoryPromptRepository implements PromptRepositoryPort {
  private readonly templates = new Map<string, PromptTemplate>();

  async save(template: PromptTemplate): Promise<void> {
    this.templates.set(key(template.tenantId, template.promptId), template);
  }

  async findById(tenantId: string, promptId: PromptId): Promise<PromptTemplate | null> {
    return this.templates.get(key(tenantId, promptId)) ?? null;
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
