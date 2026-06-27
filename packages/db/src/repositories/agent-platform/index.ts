import type {
  AgentRepositoryPort,
  AgentVersionRepositoryPort,
} from "../../../../../modules/agent-platform/agent-builder/src";
import type {
  EvalRepositoryPort,
  EvalRunRepositoryPort,
} from "../../../../../modules/agent-platform/evals/src";
import type {
  FlowRepositoryPort,
  FlowVersionRepositoryPort,
} from "../../../../../modules/agent-platform/flow-management/src";
import type {
  KnowledgeRepositoryPort,
  KnowledgeVersionRepositoryPort,
} from "../../../../../modules/agent-platform/knowledge-rag/src";
import type {
  PromptRepositoryPort,
  PromptVersionRepositoryPort,
} from "../../../../../modules/agent-platform/prompt-management/src";
import {
  agentDeploymentFromPrisma,
  agentDeploymentToPrisma,
  agentFromPrisma,
  agentToPrisma,
  agentVersionFromPrisma,
  agentVersionToPrisma,
  evalResultFromPrisma,
  evalResultToPrisma,
  evalRunFromPrisma,
  evalRunToPrisma,
  evalScenarioFromPrisma,
  evalScenarioToPrisma,
  flowDefinitionFromPrisma,
  flowDefinitionToPrisma,
  flowVersionFromPrisma,
  flowVersionToPrisma,
  knowledgeBaseFromPrisma,
  knowledgeBaseToPrisma,
  knowledgeBaseVersionFromPrisma,
  knowledgeBaseVersionToPrisma,
  knowledgeChunkFromPrisma,
  knowledgeChunkToPrisma,
  knowledgeDocumentFromPrisma,
  knowledgeDocumentToPrisma,
  promptTemplateFromPrisma,
  promptTemplateToPrisma,
  promptVersionFromPrisma,
  promptVersionToPrisma,
} from "../../mappers/agent-platform";
import {
  fromPersistedRow,
  fromPersistedRows,
  type HyperionPrismaClient,
} from "../../prisma/prisma-types";

export class PrismaAgentRepository implements AgentRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<AgentRepositoryPort["save"]>
  ): ReturnType<AgentRepositoryPort["save"]> {
    const data = agentToPrisma(args[0]);
    await this.prisma.agent.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<AgentRepositoryPort["findById"]>
  ): ReturnType<AgentRepositoryPort["findById"]> {
    const [tenantId, agentId] = args;
    const row = await this.prisma.agent.findFirst({ where: { tenantId, id: agentId } });
    return row ? fromPersistedRow(agentFromPrisma, row) : null;
  }

  async saveDeployment(
    ...args: Parameters<AgentRepositoryPort["saveDeployment"]>
  ): ReturnType<AgentRepositoryPort["saveDeployment"]> {
    const data = agentDeploymentToPrisma(args[0]);
    await this.prisma.agentDeployment.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findDeployments(
    ...args: Parameters<AgentRepositoryPort["findDeployments"]>
  ): ReturnType<AgentRepositoryPort["findDeployments"]> {
    const [tenantId, agentId] = args;
    const rows = await this.prisma.agentDeployment.findMany({ where: { tenantId, agentId } });
    return fromPersistedRows(agentDeploymentFromPrisma, rows);
  }
}

export class PrismaAgentVersionRepository implements AgentVersionRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<AgentVersionRepositoryPort["save"]>
  ): ReturnType<AgentVersionRepositoryPort["save"]> {
    const data = agentVersionToPrisma(args[0]);
    await this.prisma.agentVersion.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<AgentVersionRepositoryPort["findById"]>
  ): ReturnType<AgentVersionRepositoryPort["findById"]> {
    const [tenantId, agentVersionId] = args;
    const row = await this.prisma.agentVersion.findFirst({
      where: { tenantId, id: agentVersionId },
    });
    return row ? fromPersistedRow(agentVersionFromPrisma, row) : null;
  }

  async findByAgent(
    ...args: Parameters<AgentVersionRepositoryPort["findByAgent"]>
  ): ReturnType<AgentVersionRepositoryPort["findByAgent"]> {
    const [tenantId, agentId] = args;
    const rows = await this.prisma.agentVersion.findMany({
      where: { tenantId, agentId },
      orderBy: { versionNumber: "asc" },
    });
    return fromPersistedRows(agentVersionFromPrisma, rows);
  }
}

export class PrismaPromptRepository implements PromptRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<PromptRepositoryPort["save"]>
  ): ReturnType<PromptRepositoryPort["save"]> {
    const data = promptTemplateToPrisma(args[0]);
    await this.prisma.promptTemplate.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<PromptRepositoryPort["findById"]>
  ): ReturnType<PromptRepositoryPort["findById"]> {
    const [tenantId, promptId] = args;
    const row = await this.prisma.promptTemplate.findFirst({ where: { tenantId, id: promptId } });
    return row ? fromPersistedRow(promptTemplateFromPrisma, row) : null;
  }
}

export class PrismaPromptVersionRepository implements PromptVersionRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<PromptVersionRepositoryPort["save"]>
  ): ReturnType<PromptVersionRepositoryPort["save"]> {
    const data = promptVersionToPrisma(args[0]);
    await this.prisma.promptVersion.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<PromptVersionRepositoryPort["findById"]>
  ): ReturnType<PromptVersionRepositoryPort["findById"]> {
    const [tenantId, promptVersionId] = args;
    const row = await this.prisma.promptVersion.findFirst({
      where: { tenantId, id: promptVersionId },
    });
    return row ? fromPersistedRow(promptVersionFromPrisma, row) : null;
  }

  async findByPrompt(
    ...args: Parameters<PromptVersionRepositoryPort["findByPrompt"]>
  ): ReturnType<PromptVersionRepositoryPort["findByPrompt"]> {
    const [tenantId, promptId] = args;
    const rows = await this.prisma.promptVersion.findMany({
      where: { tenantId, promptId },
      orderBy: { versionNumber: "asc" },
    });
    return fromPersistedRows(promptVersionFromPrisma, rows);
  }
}

export class PrismaFlowRepository implements FlowRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<FlowRepositoryPort["save"]>
  ): ReturnType<FlowRepositoryPort["save"]> {
    const data = flowDefinitionToPrisma(args[0]);
    await this.prisma.flowDefinition.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<FlowRepositoryPort["findById"]>
  ): ReturnType<FlowRepositoryPort["findById"]> {
    const [tenantId, flowId] = args;
    const row = await this.prisma.flowDefinition.findFirst({ where: { tenantId, id: flowId } });
    return row ? fromPersistedRow(flowDefinitionFromPrisma, row) : null;
  }
}

export class PrismaFlowVersionRepository implements FlowVersionRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<FlowVersionRepositoryPort["save"]>
  ): ReturnType<FlowVersionRepositoryPort["save"]> {
    const data = flowVersionToPrisma(args[0]);
    await this.prisma.flowVersion.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<FlowVersionRepositoryPort["findById"]>
  ): ReturnType<FlowVersionRepositoryPort["findById"]> {
    const [tenantId, flowVersionId] = args;
    const row = await this.prisma.flowVersion.findFirst({ where: { tenantId, id: flowVersionId } });
    return row ? fromPersistedRow(flowVersionFromPrisma, row) : null;
  }

  async findByFlow(
    ...args: Parameters<FlowVersionRepositoryPort["findByFlow"]>
  ): ReturnType<FlowVersionRepositoryPort["findByFlow"]> {
    const [tenantId, flowId] = args;
    const rows = await this.prisma.flowVersion.findMany({
      where: { tenantId, flowId },
      orderBy: { versionNumber: "asc" },
    });
    return fromPersistedRows(flowVersionFromPrisma, rows);
  }
}

export class PrismaKnowledgeRepository implements KnowledgeRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async saveKnowledgeBase(
    ...args: Parameters<KnowledgeRepositoryPort["saveKnowledgeBase"]>
  ): ReturnType<KnowledgeRepositoryPort["saveKnowledgeBase"]> {
    const data = knowledgeBaseToPrisma(args[0]);
    await this.prisma.knowledgeBase.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findKnowledgeBase(
    ...args: Parameters<KnowledgeRepositoryPort["findKnowledgeBase"]>
  ): ReturnType<KnowledgeRepositoryPort["findKnowledgeBase"]> {
    const [tenantId, knowledgeBaseId] = args;
    const row = await this.prisma.knowledgeBase.findFirst({
      where: { tenantId, id: knowledgeBaseId },
    });
    return row ? fromPersistedRow(knowledgeBaseFromPrisma, row) : null;
  }

  async saveDocument(
    ...args: Parameters<KnowledgeRepositoryPort["saveDocument"]>
  ): ReturnType<KnowledgeRepositoryPort["saveDocument"]> {
    const data = knowledgeDocumentToPrisma(args[0]);
    await this.prisma.knowledgeDocument.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findDocument(
    ...args: Parameters<KnowledgeRepositoryPort["findDocument"]>
  ): ReturnType<KnowledgeRepositoryPort["findDocument"]> {
    const [tenantId, documentId] = args;
    const row = await this.prisma.knowledgeDocument.findFirst({
      where: { tenantId, id: documentId },
    });
    return row ? fromPersistedRow(knowledgeDocumentFromPrisma, row) : null;
  }

  async saveChunks(
    ...args: Parameters<KnowledgeRepositoryPort["saveChunks"]>
  ): ReturnType<KnowledgeRepositoryPort["saveChunks"]> {
    await this.prisma.knowledgeChunk.createMany({
      data: args[0].map(knowledgeChunkToPrisma),
      skipDuplicates: true,
    });
  }

  async findChunksByDocument(
    ...args: Parameters<KnowledgeRepositoryPort["findChunksByDocument"]>
  ): ReturnType<KnowledgeRepositoryPort["findChunksByDocument"]> {
    const [tenantId, documentId] = args;
    const rows = await this.prisma.knowledgeChunk.findMany({
      where: { tenantId, documentId },
      orderBy: { ordinal: "asc" },
    });
    return fromPersistedRows(knowledgeChunkFromPrisma, rows);
  }
}

export class PrismaKnowledgeVersionRepository implements KnowledgeVersionRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<KnowledgeVersionRepositoryPort["save"]>
  ): ReturnType<KnowledgeVersionRepositoryPort["save"]> {
    const data = knowledgeBaseVersionToPrisma(args[0]);
    await this.prisma.knowledgeBaseVersion.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(
    ...args: Parameters<KnowledgeVersionRepositoryPort["findById"]>
  ): ReturnType<KnowledgeVersionRepositoryPort["findById"]> {
    const [tenantId, knowledgeBaseVersionId] = args;
    const row = await this.prisma.knowledgeBaseVersion.findFirst({
      where: { tenantId, id: knowledgeBaseVersionId },
    });
    return row ? fromPersistedRow(knowledgeBaseVersionFromPrisma, row) : null;
  }

  async findByKnowledgeBase(
    ...args: Parameters<KnowledgeVersionRepositoryPort["findByKnowledgeBase"]>
  ): ReturnType<KnowledgeVersionRepositoryPort["findByKnowledgeBase"]> {
    const [tenantId, knowledgeBaseId] = args;
    const rows = await this.prisma.knowledgeBaseVersion.findMany({
      where: { tenantId, knowledgeBaseId },
      orderBy: { versionNumber: "asc" },
    });
    return fromPersistedRows(knowledgeBaseVersionFromPrisma, rows);
  }
}

export class PrismaEvalRepository implements EvalRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async saveScenario(
    ...args: Parameters<EvalRepositoryPort["saveScenario"]>
  ): ReturnType<EvalRepositoryPort["saveScenario"]> {
    const data = evalScenarioToPrisma(args[0]);
    await this.prisma.evalScenario.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findScenario(
    ...args: Parameters<EvalRepositoryPort["findScenario"]>
  ): ReturnType<EvalRepositoryPort["findScenario"]> {
    const [tenantId, evalScenarioId] = args;
    const row = await this.prisma.evalScenario.findFirst({
      where: { tenantId, id: evalScenarioId },
    });
    return row ? fromPersistedRow(evalScenarioFromPrisma, row) : null;
  }

  async findScenariosByTenant(
    ...args: Parameters<EvalRepositoryPort["findScenariosByTenant"]>
  ): ReturnType<EvalRepositoryPort["findScenariosByTenant"]> {
    const rows = await this.prisma.evalScenario.findMany({ where: { tenantId: args[0] } });
    return fromPersistedRows(evalScenarioFromPrisma, rows);
  }
}

export class PrismaEvalRunRepository implements EvalRunRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async saveRun(
    ...args: Parameters<EvalRunRepositoryPort["saveRun"]>
  ): ReturnType<EvalRunRepositoryPort["saveRun"]> {
    const data = evalRunToPrisma(args[0]);
    await this.prisma.evalRun.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findRun(
    ...args: Parameters<EvalRunRepositoryPort["findRun"]>
  ): ReturnType<EvalRunRepositoryPort["findRun"]> {
    const [tenantId, evalRunId] = args;
    const row = await this.prisma.evalRun.findFirst({ where: { tenantId, id: evalRunId } });
    return row ? fromPersistedRow(evalRunFromPrisma, row) : null;
  }

  async saveResult(
    ...args: Parameters<EvalRunRepositoryPort["saveResult"]>
  ): ReturnType<EvalRunRepositoryPort["saveResult"]> {
    const data = evalResultToPrisma(args[0]);
    await this.prisma.evalResult.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findResultsByRun(
    ...args: Parameters<EvalRunRepositoryPort["findResultsByRun"]>
  ): ReturnType<EvalRunRepositoryPort["findResultsByRun"]> {
    const [tenantId, evalRunId] = args;
    const rows = await this.prisma.evalResult.findMany({
      where: { tenantId, evalRunId },
      orderBy: { occurredAt: "asc" },
    });
    return fromPersistedRows(evalResultFromPrisma, rows);
  }
}
