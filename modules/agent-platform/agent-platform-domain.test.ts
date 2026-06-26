import { describe, expect, it } from "vitest";

import {
  activateAgentVersion,
  createAgent,
  createAgentVersion,
  deployAgentVersion,
} from "./agent-builder/src";
import { createEvalScenario, recordEvalResult, startEvalRun, summarizeEvalRun } from "./evals/src";
import {
  activateFlowVersion,
  createFlowDefinition,
  createFlowVersion,
  validateFlowGraph,
  type FlowNode,
  type FlowTransition,
} from "./flow-management/src";
import {
  activateKnowledgeBaseVersion,
  chunkKnowledgeDocument,
  createKnowledgeBase,
  createKnowledgeBaseVersion,
  defaultRetrievalPolicy,
  registerKnowledgeDocument,
  retrieveKnowledgeContext,
} from "./knowledge-rag/src";
import {
  activatePromptVersion,
  createPromptTemplate,
  createPromptVersion,
  renderPromptPreview,
} from "./prompt-management/src";
import { redactedMetadataValue } from "../../packages/shared/src/core";
import {
  InMemoryAgentRepository,
  InMemoryAgentVersionRepository,
  InMemoryEvalRepository,
  InMemoryEvalRunRepository,
  InMemoryFlowRepository,
  InMemoryFlowVersionRepository,
  InMemoryKnowledgeRepository,
  InMemoryKnowledgeVersionRepository,
  InMemoryPromptRepository,
  InMemoryPromptVersionRepository,
  FakeRetrievalProvider,
  createAgentPlatformTestContext,
} from "../../packages/testing/src/agent-platform";
import {
  InMemoryFeedbackRepository,
  createTestOperationContext,
} from "../../packages/testing/src/core";

describe("agent platform domain", () => {
  it("creates a draft agent with tenantId", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const repository = new InMemoryAgentRepository();

    const result = await createAgent({
      context,
      actor: manager,
      repository,
      agentId: "main-agent",
      name: "Main agent",
      description: "Agent foundation",
      defaultLocale: "es-CO",
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.tenantId).toBe("tenant-alpha");
    expect(result.ok && result.value.status).toBe("draft");
  });

  it("requires agent:write to create an agent", async () => {
    const { viewer } = createAgentPlatformTestContext();

    const result = await createAgent({
      context: createTestOperationContext({ actorId: "actor-viewer" }),
      actor: viewer,
      repository: new InMemoryAgentRepository(),
      agentId: "viewer-agent",
      name: "Viewer agent",
      description: "Should fail",
      defaultLocale: "es-CO",
    });

    expect(result.ok).toBe(false);
  });

  it("denies tenant-viewer agent creation", async () => {
    const { viewer } = createAgentPlatformTestContext();
    const context = createTestOperationContext({ actorId: "actor-viewer" });

    const result = await createAgent({
      context,
      actor: viewer,
      repository: new InMemoryAgentRepository(),
      agentId: "tenant-viewer-agent",
      name: "Viewer agent",
      description: "Should fail",
      defaultLocale: "es-CO",
    });

    expect(result.ok).toBe(false);
  });

  it("creates incremental draft agent versions", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const agentRepository = new InMemoryAgentRepository();
    const versionRepository = new InMemoryAgentVersionRepository();
    await createAgent({
      context,
      actor: manager,
      repository: agentRepository,
      agentId: "versioned-agent",
      name: "Versioned agent",
      description: "Agent",
      defaultLocale: "es-CO",
    });

    const first = await createAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentId: "versioned-agent",
      capabilities: ["conversation.context"],
    });
    const second = await createAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentId: "versioned-agent",
      capabilities: ["conversation.context", "knowledge.retrieve"],
    });

    expect(first.ok && first.value.versionNumber).toBe(1);
    expect(second.ok && second.value.versionNumber).toBe(2);
    expect(second.ok && second.value.status).toBe("draft");
  });

  it("keeps one active agent version", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const agentRepository = new InMemoryAgentRepository();
    const versionRepository = new InMemoryAgentVersionRepository();
    await createAgent({
      context,
      actor: manager,
      repository: agentRepository,
      agentId: "active-agent",
      name: "Active agent",
      description: "Agent",
      defaultLocale: "es-CO",
    });
    const first = await createAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentId: "active-agent",
      capabilities: ["conversation.context"],
    });
    const second = await createAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentId: "active-agent",
      capabilities: ["knowledge.retrieve"],
    });
    if (!first.ok || !second.ok) {
      throw new Error("agent versions should be created");
    }

    await activateAgentVersion({
      context,
      actor: manager,
      repository: versionRepository,
      agentVersionId: first.value.agentVersionId,
    });
    await activateAgentVersion({
      context,
      actor: manager,
      repository: versionRepository,
      agentVersionId: second.value.agentVersionId,
    });

    const versions = await versionRepository.findByAgent("tenant-alpha", first.value.agentId);
    expect(versions.filter((version) => version.status === "active")).toHaveLength(1);
    expect(
      versions.find((version) => version.agentVersionId === first.value.agentVersionId)?.status,
    ).toBe("archived");
  });

  it("allows sandbox deployments", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const agentRepository = new InMemoryAgentRepository();
    const versionRepository = new InMemoryAgentVersionRepository();
    await createAgent({
      context,
      actor: manager,
      repository: agentRepository,
      agentId: "deploy-agent",
      name: "Deploy agent",
      description: "Agent",
      defaultLocale: "es-CO",
    });
    const version = await createAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentId: "deploy-agent",
      capabilities: ["conversation.context"],
    });
    if (!version.ok) {
      throw new Error("agent version should be created");
    }

    const deployment = await deployAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentVersionId: version.value.agentVersionId,
      environment: "sandbox",
    });

    expect(deployment.ok && deployment.value.environment).toBe("sandbox");
    expect(deployment.ok && deployment.value.status).toBe("active");
  });

  it("blocks production deployments in this phase", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const agentRepository = new InMemoryAgentRepository();
    const versionRepository = new InMemoryAgentVersionRepository();
    await createAgent({
      context,
      actor: manager,
      repository: agentRepository,
      agentId: "blocked-deploy-agent",
      name: "Blocked deploy agent",
      description: "Agent",
      defaultLocale: "es-CO",
    });
    const version = await createAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentId: "blocked-deploy-agent",
      capabilities: ["conversation.context"],
    });
    if (!version.ok) {
      throw new Error("agent version should be created");
    }

    const deployment = await deployAgentVersion({
      context,
      actor: manager,
      agentRepository,
      versionRepository,
      agentVersionId: version.value.agentVersionId,
      environment: "production",
    });

    expect(deployment.ok).toBe(false);
  });

  it("creates prompt templates", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const result = await createPromptTemplate({
      context,
      actor: manager,
      repository: new InMemoryPromptRepository(),
      promptId: "greeting-prompt",
      name: "Greeting",
      description: "Greeting prompt",
      scope: "agent",
    });

    expect(result.ok && result.value.promptId).toBe("greeting-prompt");
  });

  it("rejects prompt versions with secrets, api keys, or hardcoded phones", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const promptRepository = new InMemoryPromptRepository();
    const versionRepository = new InMemoryPromptVersionRepository();
    await createPromptTemplate({
      context,
      actor: manager,
      repository: promptRepository,
      promptId: "unsafe-prompt",
      name: "Unsafe",
      description: "Unsafe prompt",
      scope: "agent",
    });

    const result = await createPromptVersion({
      context,
      promptRepository,
      versionRepository,
      promptId: "unsafe-prompt",
      template: "Use apiKey=real-value and call +571234567890",
      variables: [],
    });

    expect(result.ok).toBe(false);
  });

  it("keeps one active prompt version", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const promptRepository = new InMemoryPromptRepository();
    const versionRepository = new InMemoryPromptVersionRepository();
    await createPromptTemplate({
      context,
      actor: manager,
      repository: promptRepository,
      promptId: "active-prompt",
      name: "Active",
      description: "Prompt",
      scope: "agent",
    });
    const first = await createPromptVersion({
      context,
      promptRepository,
      versionRepository,
      promptId: "active-prompt",
      template: "Hello {{name}}",
      variables: [{ name: "name", required: true, description: "Synthetic name", piiRisk: "none" }],
    });
    const second = await createPromptVersion({
      context,
      promptRepository,
      versionRepository,
      promptId: "active-prompt",
      template: "Hi {{name}}",
      variables: [{ name: "name", required: true, description: "Synthetic name", piiRisk: "none" }],
    });
    if (!first.ok || !second.ok) {
      throw new Error("prompt versions should be created");
    }

    await activatePromptVersion({
      context,
      repository: versionRepository,
      promptVersionId: first.value.promptVersionId,
    });
    await activatePromptVersion({
      context,
      repository: versionRepository,
      promptVersionId: second.value.promptVersionId,
    });

    const versions = await versionRepository.findByPrompt("tenant-alpha", first.value.promptId);
    expect(versions.filter((version) => version.status === "active")).toHaveLength(1);
  });

  it("renders prompt previews with synthetic values", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const promptRepository = new InMemoryPromptRepository();
    const versionRepository = new InMemoryPromptVersionRepository();
    await createPromptTemplate({
      context,
      actor: manager,
      repository: promptRepository,
      promptId: "preview-prompt",
      name: "Preview",
      description: "Prompt",
      scope: "agent",
    });
    const version = await createPromptVersion({
      context,
      promptRepository,
      versionRepository,
      promptId: "preview-prompt",
      template: "Hello {{syntheticName}}",
      variables: [
        {
          name: "syntheticName",
          required: true,
          description: "Synthetic placeholder",
          piiRisk: "none",
        },
      ],
    });
    if (!version.ok) {
      throw new Error("prompt version should be created");
    }

    const preview = renderPromptPreview({
      promptVersion: version.value,
      values: { syntheticName: "Sample User" },
    });

    expect(preview.ok && preview.value).toBe("Hello Sample User");
  });

  it("rejects prompt preview values with sensitive metadata keys", async () => {
    const { context, manager } = createAgentPlatformTestContext();
    const promptRepository = new InMemoryPromptRepository();
    const versionRepository = new InMemoryPromptVersionRepository();
    await createPromptTemplate({
      context,
      actor: manager,
      repository: promptRepository,
      promptId: "sensitive-preview",
      name: "Sensitive Preview",
      description: "Prompt",
      scope: "agent",
    });
    const version = await createPromptVersion({
      context,
      promptRepository,
      versionRepository,
      promptId: "sensitive-preview",
      template: "Hello {{email}}",
      variables: [{ name: "email", required: true, description: "Should reject", piiRisk: "high" }],
    });
    if (!version.ok) {
      throw new Error("prompt version should be created");
    }

    const preview = renderPromptPreview({
      promptVersion: version.value,
      values: { email: "person@example.invalid" },
    });

    expect(preview.ok).toBe(false);
  });

  it("requires exactly one start node in flow graphs", () => {
    expect(validateFlowGraph([endNode()], []).ok).toBe(false);
    expect(validateFlowGraph([startNode("start-a"), startNode("start-b"), endNode()], []).ok).toBe(
      false,
    );
  });

  it("requires at least one end node in flow graphs", () => {
    expect(validateFlowGraph([startNode()], []).ok).toBe(false);
  });

  it("rejects transitions to missing nodes", () => {
    expect(
      validateFlowGraph([startNode(), endNode()], [{ fromNodeId: "start", toNodeId: "missing" }])
        .ok,
    ).toBe(false);
  });

  it("requires explicit capabilities for tool nodes", () => {
    const nodes: FlowNode[] = [
      startNode(),
      { nodeId: "tool", type: "tool", label: "Tool" },
      endNode(),
    ];
    const transitions: FlowTransition[] = [
      { fromNodeId: "start", toNodeId: "tool" },
      { fromNodeId: "tool", toNodeId: "end" },
    ];

    expect(validateFlowGraph(nodes, transitions).ok).toBe(false);
  });

  it("keeps one active flow version", async () => {
    const { context } = createAgentPlatformTestContext();
    const flowRepository = new InMemoryFlowRepository();
    const versionRepository = new InMemoryFlowVersionRepository();
    await createFlowDefinition({
      context,
      repository: flowRepository,
      flowId: "active-flow",
      name: "Active flow",
      description: "Flow",
    });

    const first = await createFlowVersion({
      context,
      flowRepository,
      versionRepository,
      flowId: "active-flow",
      nodes: validFlowNodes(),
      transitions: validFlowTransitions(),
    });
    const second = await createFlowVersion({
      context,
      flowRepository,
      versionRepository,
      flowId: "active-flow",
      nodes: validFlowNodes(),
      transitions: validFlowTransitions(),
    });
    if (!first.ok || !second.ok) {
      throw new Error("flow versions should be created");
    }

    await activateFlowVersion({
      context,
      repository: versionRepository,
      flowVersionId: first.value.flowVersionId,
    });
    await activateFlowVersion({
      context,
      repository: versionRepository,
      flowVersionId: second.value.flowVersionId,
    });

    const versions = await versionRepository.findByFlow("tenant-alpha", first.value.flowId);
    expect(versions.filter((version) => version.status === "active")).toHaveLength(1);
  });

  it("creates knowledge bases by tenant", async () => {
    const { context } = createAgentPlatformTestContext();
    const result = await createKnowledgeBase({
      context,
      repository: new InMemoryKnowledgeRepository(),
      knowledgeBaseId: "main-kb",
      name: "Main KB",
      description: "Knowledge base",
    });

    expect(result.ok && result.value.tenantId).toBe("tenant-alpha");
  });

  it("registers knowledge documents with sanitized metadata", async () => {
    const { context } = createAgentPlatformTestContext();
    const repository = new InMemoryKnowledgeRepository();
    await createKnowledgeBase({
      context,
      repository,
      knowledgeBaseId: "docs-kb",
      name: "Docs KB",
      description: "Knowledge base",
    });

    const document = await registerKnowledgeDocument({
      context,
      repository,
      knowledgeBaseId: "docs-kb",
      title: "Synthetic guide",
      sourceType: "manual",
      metadata: { email: "person@example.invalid", safe: "kept" },
    });

    expect(document.ok && document.value.metadata.email).toBe(redactedMetadataValue);
    expect(document.ok && document.value.metadata.safe).toBe("kept");
  });

  it("chunks knowledge documents in order", async () => {
    const { context } = createAgentPlatformTestContext();
    const repository = new InMemoryKnowledgeRepository();
    await createKnowledgeBase({
      context,
      repository,
      knowledgeBaseId: "chunk-kb",
      name: "Chunk KB",
      description: "Knowledge base",
    });
    const document = await registerKnowledgeDocument({
      context,
      repository,
      knowledgeBaseId: "chunk-kb",
      title: "Synthetic guide",
      sourceType: "manual",
    });
    if (!document.ok) {
      throw new Error("document should be registered");
    }

    const chunks = await chunkKnowledgeDocument({
      context,
      repository,
      documentId: document.value.documentId,
      text: "abcdef",
      chunkSize: 2,
    });

    expect(chunks.ok && chunks.value.map((chunk) => chunk.ordinal)).toEqual([1, 2, 3]);
  });

  it("does not allow cross-tenant retrieval", async () => {
    const { context } = createAgentPlatformTestContext();
    const result = await retrieveKnowledgeContext({
      context,
      provider: new FakeRetrievalProvider([]),
      tenantId: "tenant-beta",
      query: "anything",
    });

    expect(result.ok).toBe(false);
  });

  it("defaults retrieval policy to no cross-tenant access", () => {
    expect(defaultRetrievalPolicy.allowCrossTenant).toBe(false);
    expect(defaultRetrievalPolicy.citeSources).toBe(true);
  });

  it("keeps one active knowledge base version", async () => {
    const { context } = createAgentPlatformTestContext();
    const knowledgeRepository = new InMemoryKnowledgeRepository();
    const versionRepository = new InMemoryKnowledgeVersionRepository();
    await createKnowledgeBase({
      context,
      repository: knowledgeRepository,
      knowledgeBaseId: "versioned-kb",
      name: "Versioned KB",
      description: "Knowledge base",
    });
    const first = await createKnowledgeBaseVersion({
      context,
      knowledgeRepository,
      versionRepository,
      knowledgeBaseId: "versioned-kb",
    });
    const second = await createKnowledgeBaseVersion({
      context,
      knowledgeRepository,
      versionRepository,
      knowledgeBaseId: "versioned-kb",
    });
    if (!first.ok || !second.ok) {
      throw new Error("knowledge versions should be created");
    }

    await activateKnowledgeBaseVersion({
      context,
      repository: versionRepository,
      knowledgeBaseVersionId: first.value.knowledgeBaseVersionId,
    });
    await activateKnowledgeBaseVersion({
      context,
      repository: versionRepository,
      knowledgeBaseVersionId: second.value.knowledgeBaseVersionId,
    });

    const versions = await versionRepository.findByKnowledgeBase(
      "tenant-alpha",
      first.value.knowledgeBaseId,
    );
    expect(versions.filter((version) => version.status === "active")).toHaveLength(1);
  });

  it("creates eval scenarios", async () => {
    const { context } = createAgentPlatformTestContext();
    const result = await createEvalScenario({
      context,
      repository: new InMemoryEvalRepository(),
      evalScenarioId: "handoff-policy",
      name: "Handoff policy",
      description: "Scenario",
      category: "policy",
      input: "Synthetic input",
      expectedBehavior: "Follow policy",
      forbiddenBehavior: "Skip policy",
      criteria: [{ key: "policy", description: "Policy criterion", severity: "high" }],
    });

    expect(result.ok && result.value.evalScenarioId).toBe("handoff-policy");
  });

  it("starts eval runs as running", async () => {
    const { context } = createAgentPlatformTestContext();
    const result = await startEvalRun({
      context,
      repository: new InMemoryEvalRunRepository(),
      agentVersionId: "agent-version-synthetic",
    });

    expect(result.ok && result.value.status).toBe("running");
  });

  it("records sanitized eval results", async () => {
    const { context } = createAgentPlatformTestContext();
    const scenarioRepository = new InMemoryEvalRepository();
    const runRepository = new InMemoryEvalRunRepository();
    const scenario = await createEvalScenario({
      context,
      repository: scenarioRepository,
      evalScenarioId: "sanitize-eval",
      name: "Sanitize",
      description: "Scenario",
      category: "security",
      input: "Synthetic",
      expectedBehavior: "Redact",
      forbiddenBehavior: "Leak",
      criteria: [{ key: "pii", description: "No PII", severity: "critical" }],
    });
    const run = await startEvalRun({ context, repository: runRepository });
    if (!scenario.ok || !run.ok) {
      throw new Error("eval setup should succeed");
    }

    const result = await recordEvalResult({
      context,
      repository: runRepository,
      evalRunId: run.value.evalRunId,
      evalScenarioId: scenario.value.evalScenarioId,
      status: "needs_review",
      score: 0.4,
      findings: [{ key: "pii", message: "Needs review" }],
      metadata: { token: "value", safe: "kept" },
    });

    expect(result.ok && result.value.metadata.token).toBe(redactedMetadataValue);
    expect(result.ok && result.value.metadata.safe).toBe("kept");
  });

  it("records feedback for eval policy violations", async () => {
    const { context } = createAgentPlatformTestContext();
    const scenarioRepository = new InMemoryEvalRepository();
    const runRepository = new InMemoryEvalRunRepository();
    const feedbackRepository = new InMemoryFeedbackRepository();
    const scenario = await createEvalScenario({
      context,
      repository: scenarioRepository,
      evalScenarioId: "policy-violation-eval",
      name: "Policy violation",
      description: "Scenario",
      category: "security",
      input: "Synthetic",
      expectedBehavior: "No violation",
      forbiddenBehavior: "Violation",
      criteria: [{ key: "policy", description: "No policy violation", severity: "critical" }],
    });
    const run = await startEvalRun({ context, repository: runRepository });
    if (!scenario.ok || !run.ok) {
      throw new Error("eval setup should succeed");
    }

    await recordEvalResult({
      context,
      repository: runRepository,
      evalRunId: run.value.evalRunId,
      evalScenarioId: scenario.value.evalScenarioId,
      status: "failed",
      score: 0,
      findings: [{ key: "policy", message: "Policy violation", policyViolation: true }],
      feedbackRepository,
    });

    const feedback = await feedbackRepository.findByTenant("tenant-alpha");
    expect(feedback).toHaveLength(1);
    expect(feedback[0]?.outcome).toBe("policy_violation");
  });

  it("summarizes eval runs", async () => {
    const { context } = createAgentPlatformTestContext();
    const scenarioRepository = new InMemoryEvalRepository();
    const runRepository = new InMemoryEvalRunRepository();
    const scenario = await createEvalScenario({
      context,
      repository: scenarioRepository,
      evalScenarioId: "summary-eval",
      name: "Summary",
      description: "Scenario",
      category: "quality",
      input: "Synthetic",
      expectedBehavior: "Good",
      forbiddenBehavior: "Bad",
      criteria: [{ key: "quality", description: "Quality", severity: "medium" }],
    });
    const run = await startEvalRun({ context, repository: runRepository });
    if (!scenario.ok || !run.ok) {
      throw new Error("eval setup should succeed");
    }

    await recordEvalResult({
      context,
      repository: runRepository,
      evalRunId: run.value.evalRunId,
      evalScenarioId: scenario.value.evalScenarioId,
      status: "passed",
      score: 1,
      findings: [],
    });
    await recordEvalResult({
      context,
      repository: runRepository,
      evalRunId: run.value.evalRunId,
      evalScenarioId: scenario.value.evalScenarioId,
      status: "failed",
      score: 0,
      findings: [{ key: "quality", message: "Failed" }],
    });
    await recordEvalResult({
      context,
      repository: runRepository,
      evalRunId: run.value.evalRunId,
      evalScenarioId: scenario.value.evalScenarioId,
      status: "needs_review",
      score: 0.5,
      findings: [{ key: "quality", message: "Review" }],
    });

    const summary = await summarizeEvalRun({
      tenantId: "tenant-alpha",
      repository: runRepository,
      evalRunId: run.value.evalRunId,
    });

    expect(summary.ok && summary.value.status).toBe("failed");
    expect(summary.ok && summary.value.total).toBe(3);
    expect(summary.ok && summary.value.needsReview).toBe(1);
  });
});

function startNode(nodeId = "start"): FlowNode {
  return { nodeId, type: "start", label: "Start" };
}

function endNode(nodeId = "end"): FlowNode {
  return { nodeId, type: "end", label: "End" };
}

function validFlowNodes(): readonly FlowNode[] {
  return [
    startNode(),
    {
      nodeId: "tool",
      type: "tool",
      label: "Tool",
      requiredCapability: "knowledge.retrieve",
    },
    endNode(),
  ];
}

function validFlowTransitions(): readonly FlowTransition[] {
  return [
    { fromNodeId: "start", toNodeId: "tool" },
    { fromNodeId: "tool", toNodeId: "end" },
  ];
}
