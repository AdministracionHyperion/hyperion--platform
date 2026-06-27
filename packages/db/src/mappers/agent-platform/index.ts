import type {
  Agent,
  AgentDeployment,
  AgentVersion,
} from "../../../../../modules/agent-platform/agent-builder/src";
import type {
  EvalResult,
  EvalRun,
  EvalScenario,
} from "../../../../../modules/agent-platform/evals/src";
import type {
  FlowDefinition,
  FlowVersion,
} from "../../../../../modules/agent-platform/flow-management/src";
import type {
  KnowledgeBase,
  KnowledgeBaseVersion,
  KnowledgeChunk,
  KnowledgeDocument,
} from "../../../../../modules/agent-platform/knowledge-rag/src";
import type {
  PromptTemplate,
  PromptVersion,
} from "../../../../../modules/agent-platform/prompt-management/src";
import { sanitizeMetadata } from "../../../../shared/src/core";
import { toPrismaJson, toSafeMetadata, toStringArray } from "../../prisma/prisma-types";

export const agentToPrisma = (agent: Agent) => ({
  id: agent.agentId,
  tenantId: agent.tenantId,
  name: agent.name,
  description: agent.description,
  status: agent.status,
  defaultLocale: agent.defaultLocale,
  createdBy: agent.createdBy,
  metadata: toPrismaJson(sanitizeMetadata(agent.metadata)),
  createdAt: agent.createdAt,
  updatedAt: agent.updatedAt,
});

export function agentFromPrisma(row: ReturnType<typeof agentToPrisma>): Agent {
  return { ...row, agentId: row.id as Agent["agentId"], metadata: toSafeMetadata(row.metadata) };
}

export const agentVersionToPrisma = (version: AgentVersion) => ({
  id: version.agentVersionId,
  tenantId: version.tenantId,
  agentId: version.agentId,
  versionNumber: version.versionNumber,
  status: version.status,
  promptVersionId: version.promptVersionId,
  flowVersionId: version.flowVersionId,
  knowledgeBaseVersionId: version.knowledgeBaseVersionId,
  capabilities: toPrismaJson(version.capabilities),
  createdBy: version.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: version.createdAt,
  activatedAt: version.activatedAt,
});

export function agentVersionFromPrisma(row: ReturnType<typeof agentVersionToPrisma>): AgentVersion {
  return {
    agentVersionId: row.id as AgentVersion["agentVersionId"],
    tenantId: row.tenantId,
    agentId: row.agentId as AgentVersion["agentId"],
    versionNumber: row.versionNumber,
    status: row.status as AgentVersion["status"],
    promptVersionId: row.promptVersionId,
    flowVersionId: row.flowVersionId,
    knowledgeBaseVersionId: row.knowledgeBaseVersionId,
    capabilities: toStringArray(row.capabilities) as AgentVersion["capabilities"],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    activatedAt: row.activatedAt,
  };
}

export const agentDeploymentToPrisma = (deployment: AgentDeployment) => ({
  id: deployment.deploymentId,
  tenantId: deployment.tenantId,
  agentId: deployment.agentId,
  agentVersionId: deployment.agentVersionId,
  environment: deployment.environment,
  status: deployment.status,
  deployedBy: deployment.deployedBy,
  deployedAt: deployment.deployedAt,
  metadata: toPrismaJson(sanitizeMetadata()),
});

export function agentDeploymentFromPrisma(
  row: ReturnType<typeof agentDeploymentToPrisma>,
): AgentDeployment {
  return {
    deploymentId: row.id as AgentDeployment["deploymentId"],
    tenantId: row.tenantId,
    agentId: row.agentId as AgentDeployment["agentId"],
    agentVersionId: row.agentVersionId as AgentDeployment["agentVersionId"],
    environment: row.environment as AgentDeployment["environment"],
    status: row.status as AgentDeployment["status"],
    deployedBy: row.deployedBy,
    deployedAt: row.deployedAt,
  };
}

export const promptTemplateToPrisma = (template: PromptTemplate) => ({
  id: template.promptId,
  tenantId: template.tenantId,
  name: template.name,
  description: template.description,
  scope: template.scope,
  createdBy: template.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
});

export function promptTemplateFromPrisma(
  row: ReturnType<typeof promptTemplateToPrisma>,
): PromptTemplate {
  return { ...row, promptId: row.id as PromptTemplate["promptId"] };
}

export const promptVersionToPrisma = (version: PromptVersion) => ({
  id: version.promptVersionId,
  tenantId: version.tenantId,
  promptId: version.promptId,
  versionNumber: version.versionNumber,
  status: version.status,
  template: version.template,
  variables: toPrismaJson(version.variables),
  policy: toPrismaJson(version.policy),
  createdBy: version.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: version.createdAt,
  activatedAt: version.activatedAt,
});

export function promptVersionFromPrisma(
  row: ReturnType<typeof promptVersionToPrisma>,
): PromptVersion {
  return {
    promptVersionId: row.id as PromptVersion["promptVersionId"],
    tenantId: row.tenantId,
    promptId: row.promptId as PromptVersion["promptId"],
    versionNumber: row.versionNumber,
    status: row.status as PromptVersion["status"],
    template: row.template,
    variables: (Array.isArray(row.variables) ? row.variables : []) as PromptVersion["variables"],
    policy: (typeof row.policy === "object" && row.policy
      ? row.policy
      : {}) as unknown as PromptVersion["policy"],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    activatedAt: row.activatedAt,
  };
}

export const flowDefinitionToPrisma = (flow: FlowDefinition) => ({
  id: flow.flowId,
  tenantId: flow.tenantId,
  name: flow.name,
  description: flow.description,
  createdBy: flow.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: flow.createdAt,
  updatedAt: flow.updatedAt,
});

export const flowDefinitionFromPrisma = (
  row: ReturnType<typeof flowDefinitionToPrisma>,
): FlowDefinition => ({
  ...row,
  flowId: row.id as FlowDefinition["flowId"],
});

export const flowVersionToPrisma = (version: FlowVersion) => ({
  id: version.flowVersionId,
  tenantId: version.tenantId,
  flowId: version.flowId,
  versionNumber: version.versionNumber,
  status: version.status,
  nodes: toPrismaJson(version.nodes),
  transitions: toPrismaJson(version.transitions),
  createdBy: version.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: version.createdAt,
  activatedAt: version.activatedAt,
});

export const flowVersionFromPrisma = (
  row: ReturnType<typeof flowVersionToPrisma>,
): FlowVersion => ({
  flowVersionId: row.id as FlowVersion["flowVersionId"],
  tenantId: row.tenantId,
  flowId: row.flowId as FlowVersion["flowId"],
  versionNumber: row.versionNumber,
  status: row.status as FlowVersion["status"],
  nodes: (Array.isArray(row.nodes) ? row.nodes : []) as FlowVersion["nodes"],
  transitions: (Array.isArray(row.transitions)
    ? row.transitions
    : []) as FlowVersion["transitions"],
  createdBy: row.createdBy,
  createdAt: row.createdAt,
  activatedAt: row.activatedAt,
});

export const knowledgeBaseToPrisma = (base: KnowledgeBase) => ({
  id: base.knowledgeBaseId,
  tenantId: base.tenantId,
  name: base.name,
  description: base.description,
  createdBy: base.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: base.createdAt,
  updatedAt: base.updatedAt,
});

export const knowledgeBaseFromPrisma = (
  row: ReturnType<typeof knowledgeBaseToPrisma>,
): KnowledgeBase => ({
  ...row,
  knowledgeBaseId: row.id as KnowledgeBase["knowledgeBaseId"],
});

export const knowledgeBaseVersionToPrisma = (version: KnowledgeBaseVersion) => ({
  id: version.knowledgeBaseVersionId,
  tenantId: version.tenantId,
  knowledgeBaseId: version.knowledgeBaseId,
  versionNumber: version.versionNumber,
  status: version.status,
  retrievalPolicy: toPrismaJson(version.retrievalPolicy),
  createdBy: version.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: version.createdAt,
  activatedAt: version.activatedAt,
});

export const knowledgeBaseVersionFromPrisma = (
  row: ReturnType<typeof knowledgeBaseVersionToPrisma>,
): KnowledgeBaseVersion => ({
  knowledgeBaseVersionId: row.id as KnowledgeBaseVersion["knowledgeBaseVersionId"],
  tenantId: row.tenantId,
  knowledgeBaseId: row.knowledgeBaseId as KnowledgeBaseVersion["knowledgeBaseId"],
  versionNumber: row.versionNumber,
  status: row.status as KnowledgeBaseVersion["status"],
  retrievalPolicy: (typeof row.retrievalPolicy === "object" && row.retrievalPolicy
    ? row.retrievalPolicy
    : {}) as unknown as KnowledgeBaseVersion["retrievalPolicy"],
  createdBy: row.createdBy,
  createdAt: row.createdAt,
  activatedAt: row.activatedAt,
});

export const knowledgeDocumentToPrisma = (document: KnowledgeDocument) => ({
  id: document.documentId,
  tenantId: document.tenantId,
  knowledgeBaseId: document.knowledgeBaseId,
  title: document.title,
  sourceType: document.sourceType,
  status: document.status,
  metadata: toPrismaJson(sanitizeMetadata(document.metadata)),
  createdBy: document.createdBy,
  createdAt: document.createdAt,
  updatedAt: document.createdAt,
});

export const knowledgeDocumentFromPrisma = (
  row: ReturnType<typeof knowledgeDocumentToPrisma>,
): KnowledgeDocument => ({
  documentId: row.id as KnowledgeDocument["documentId"],
  tenantId: row.tenantId,
  knowledgeBaseId: row.knowledgeBaseId as KnowledgeDocument["knowledgeBaseId"],
  title: row.title,
  sourceType: row.sourceType as KnowledgeDocument["sourceType"],
  status: row.status as KnowledgeDocument["status"],
  metadata: toSafeMetadata(row.metadata),
  createdBy: row.createdBy,
  createdAt: row.createdAt,
});

export const knowledgeChunkToPrisma = (chunk: KnowledgeChunk) => ({
  id: chunk.chunkId,
  tenantId: chunk.tenantId,
  documentId: chunk.documentId,
  text: chunk.text,
  ordinal: chunk.ordinal,
  metadata: toPrismaJson(sanitizeMetadata(chunk.metadata)),
  createdAt: new Date(0),
});

export const knowledgeChunkFromPrisma = (
  row: ReturnType<typeof knowledgeChunkToPrisma>,
): KnowledgeChunk => ({
  chunkId: row.id as KnowledgeChunk["chunkId"],
  tenantId: row.tenantId,
  documentId: row.documentId as KnowledgeChunk["documentId"],
  text: row.text,
  ordinal: row.ordinal,
  metadata: toSafeMetadata(row.metadata),
});

export const evalScenarioToPrisma = (scenario: EvalScenario) => ({
  id: scenario.evalScenarioId,
  tenantId: scenario.tenantId,
  name: scenario.name,
  description: scenario.description,
  category: scenario.category,
  input: toPrismaJson({ text: scenario.input }),
  expectedBehavior: scenario.expectedBehavior,
  forbiddenBehavior: scenario.forbiddenBehavior,
  criteria: toPrismaJson(scenario.criteria),
  createdBy: scenario.createdBy,
  metadata: toPrismaJson(sanitizeMetadata()),
  createdAt: scenario.createdAt,
});

export const evalScenarioFromPrisma = (
  row: ReturnType<typeof evalScenarioToPrisma>,
): EvalScenario => ({
  evalScenarioId: row.id as EvalScenario["evalScenarioId"],
  tenantId: row.tenantId,
  name: row.name,
  description: row.description,
  category: row.category,
  input:
    typeof row.input === "object" && row.input && "text" in row.input
      ? String((row.input as { readonly text: unknown }).text)
      : "",
  expectedBehavior: row.expectedBehavior,
  forbiddenBehavior: row.forbiddenBehavior,
  criteria: (Array.isArray(row.criteria) ? row.criteria : []) as EvalScenario["criteria"],
  createdBy: row.createdBy,
  createdAt: row.createdAt,
});

export const evalRunToPrisma = (run: EvalRun) => ({
  id: run.evalRunId,
  tenantId: run.tenantId,
  agentVersionId: run.agentVersionId,
  status: run.status,
  startedBy: run.startedBy,
  startedAt: run.startedAt,
  completedAt: run.completedAt,
  metadata: toPrismaJson(sanitizeMetadata()),
});

export const evalRunFromPrisma = (row: ReturnType<typeof evalRunToPrisma>): EvalRun => ({
  evalRunId: row.id as EvalRun["evalRunId"],
  tenantId: row.tenantId,
  agentVersionId: row.agentVersionId,
  status: row.status as EvalRun["status"],
  startedBy: row.startedBy,
  startedAt: row.startedAt,
  completedAt: row.completedAt,
});

export const evalResultToPrisma = (result: EvalResult) => ({
  id: result.evalResultId,
  tenantId: result.tenantId,
  evalRunId: result.evalRunId,
  evalScenarioId: result.evalScenarioId,
  status: result.status,
  score: result.score,
  findings: toPrismaJson(result.findings),
  metadata: toPrismaJson(sanitizeMetadata(result.metadata)),
  occurredAt: result.occurredAt,
});

export const evalResultFromPrisma = (row: ReturnType<typeof evalResultToPrisma>): EvalResult => ({
  evalResultId: row.id as EvalResult["evalResultId"],
  tenantId: row.tenantId,
  evalRunId: row.evalRunId as EvalResult["evalRunId"],
  evalScenarioId: row.evalScenarioId as EvalResult["evalScenarioId"],
  status: row.status as EvalResult["status"],
  score: row.score,
  findings: (Array.isArray(row.findings) ? row.findings : []) as EvalResult["findings"],
  metadata: toSafeMetadata(row.metadata),
  occurredAt: row.occurredAt,
});
