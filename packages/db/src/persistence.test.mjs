import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { redactedMetadataValue } from "../../shared/src/core";
import {
  agentFromPrisma,
  agentToPrisma,
  knowledgeDocumentFromPrisma,
  knowledgeDocumentToPrisma,
  promptVersionFromPrisma,
  promptVersionToPrisma,
} from "./mappers/agent-platform";
import {
  auditEventFromPrisma,
  auditEventToPrisma,
  feedbackEventFromPrisma,
  feedbackEventToPrisma,
  tenantFromPrisma,
  tenantToPrisma,
} from "./mappers/core";
import {
  cedcoAgreementFromPrisma,
  cedcoAgreementToPrisma,
  cedcoD02ConfigurationFromPrisma,
  cedcoD02ConfigurationToPrisma,
  cedcoD02MetricFromPrisma,
  cedcoD02MetricToPrisma,
  cedcoServiceFromPrisma,
  cedcoServiceToPrisma,
  cedcoSiteFromPrisma,
  cedcoSiteToPrisma,
} from "./mappers/products/cedco/d02-calls";
import {
  callEventFromPrisma,
  callEventToPrisma,
  callSessionFromPrisma,
  callSessionToPrisma,
  conversationTurnFromPrisma,
  conversationTurnToPrisma,
  handoffRequestFromPrisma,
  handoffRequestToPrisma,
} from "./mappers/voice";
import { createPrismaClient } from "./prisma/prisma-client";
import { createRepositoryPortAssertions } from "./repository-port-assertions";
import { inspectSchemaText } from "./schema-guards/schema-inspection";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const schemaPath = path.join(root, "packages/db/prisma/schema.prisma");
const migrationPath = path.join(
  root,
  "packages/db/prisma/migrations/0001_initial_hyperion_platform/migration.sql",
);
const schemaText = readFileSync(schemaPath, "utf8");
const migrationText = readFileSync(migrationPath, "utf8");

const forbiddenFieldNames = [
  "phone",
  "phoneNumber",
  "toNumber",
  "to_number",
  "fromNumber",
  "from_number",
  "email",
  "documentNumber",
  "rawTranscript",
  "transcript",
  "audioUrl",
  "recordingUrl",
  "apiKey",
  "token",
  "secret",
  "password",
];

const operationalModels = [
  "TenantMembership",
  "AuditLog",
  "FeatureFlag",
  "VersionedResource",
  "FeedbackEvent",
  "OutboxEvent",
  "Agent",
  "AgentVersion",
  "AgentDeployment",
  "PromptTemplate",
  "PromptVersion",
  "FlowDefinition",
  "FlowVersion",
  "KnowledgeBase",
  "KnowledgeBaseVersion",
  "KnowledgeDocument",
  "KnowledgeChunk",
  "EvalScenario",
  "EvalRun",
  "EvalResult",
  "CallSession",
  "CallParticipant",
  "ConversationTurn",
  "CallEvent",
  "ProviderCallEvent",
  "PostCallResult",
  "HandoffRequest",
  "HandoffAssignment",
  "CedcoSite",
  "CedcoService",
  "CedcoAgreement",
  "CedcoD02Configuration",
  "CedcoSchedulingRequest",
  "CedcoEligibilityCheck",
  "CedcoD02EvalScenario",
  "CedcoD02Metric",
];

describe("Prisma persistence schema", () => {
  it("validates with Prisma", () => {
    execFileSync(
      process.execPath,
      ["tools/prisma-cli.mjs", "validate", "--schema", "packages/db/prisma/schema.prisma"],
      { cwd: root, stdio: "pipe" },
    );
  });

  it("schema.prisma does not define forbidden columns", () => {
    expect(findForbiddenColumns(schemaText)).toEqual([]);
  });

  it("migration.sql does not define forbidden columns", () => {
    expect(findForbiddenColumns(migrationText)).toEqual([]);
  });

  it("all operational models include tenantId", () => {
    const missing = operationalModels.filter((modelName) => {
      const model = extractModel(schemaText, modelName);
      return !model || !/^\s*tenantId\s+String\??/mu.test(model);
    });

    expect(missing).toEqual([]);
  });

  it("event models include correlationId where required", () => {
    const missing = ["AuditLog", "FeedbackEvent", "OutboxEvent", "CallSession", "CallEvent"].filter(
      (modelName) => {
        const model = extractModel(schemaText, modelName);
        return !model || !/^\s*correlationId\s+String/mu.test(model);
      },
    );

    expect(missing).toEqual([]);
  });

  it("CedcoD02Configuration has realCallsEnabled with a false schema default", () => {
    const model = extractModel(schemaText, "CedcoD02Configuration");
    expect(model).toMatch(/realCallsEnabled\s+Boolean\s+@default\(false\)/u);
  });

  it("does not define out-of-scope asset models", () => {
    const outOfScopeModel = ["R", "03"].join("");
    expect(schemaText).not.toContain(`model ${outOfScopeModel}`);
    expect(schemaText).not.toMatch(/model\s+(Asset|ActivosFijos)\b/u);
  });

  it("schema and migration do not reference real provider SDKs", () => {
    const combined = `${schemaText}\n${migrationText}`.toLowerCase();
    const providers = ["elevenlabs", "twilio", "openai", "anthropic", "telnyx", "plivo", "vonage"];

    expect(providers.filter((provider) => combined.includes(provider))).toEqual([]);
  });

  it("packages/db does not create out-of-scope product folders", () => {
    const entries = listFiles(path.join(root, "packages/db")).map((filePath) =>
      filePath.replaceAll("\\", "/").toLowerCase(),
    );

    expect(entries.some((filePath) => filePath.includes("/r03/"))).toBe(false);
    expect(entries.some((filePath) => filePath.includes("activos-fijos"))).toBe(false);
  });

  it("schema inspection passes for schema and migration", () => {
    expect(inspectSchemaText(schemaText, migrationText)).toEqual({ ok: true, issues: [] });
  });
});

describe("Prisma client factory", () => {
  it("requires databaseUrl by argument", () => {
    expect(() => createPrismaClient({ databaseUrl: "" })).toThrow("databaseUrl is required");
  });

  it("does not read environment variables directly", () => {
    const source = readFileSync(path.join(root, "packages/db/src/prisma/prisma-client.ts"), "utf8");
    expect(source).not.toContain(["process", "env"].join("."));
  });

  it("packages/db does not contain a real database URL", () => {
    const urls = listFiles(path.join(root, "packages/db"))
      .flatMap(
        (filePath) => readFileSync(filePath, "utf8").match(/postgres(?:ql)?:\/\/[^\s"']+/giu) ?? [],
      )
      .filter((url) => !url.includes("placeholder"));

    expect(urls).toEqual([]);
  });
});

describe("domain mappers", () => {
  const occurredAt = new Date("2026-01-01T00:00:00.000Z");

  it("Tenant mapper preserves tenantId", () => {
    const mapped = tenantFromPrisma(
      tenantToPrisma({
        tenantId: "cedco",
        name: "CEDCO",
        status: "active",
        createdAt: occurredAt,
        updatedAt: occurredAt,
      }),
    );

    expect(mapped.tenantId).toBe("cedco");
  });

  it("Audit mapper preserves correlationId and sanitizes metadata", () => {
    const mapped = auditEventFromPrisma(
      auditEventToPrisma({
        auditEventId: "audit-1",
        tenantId: "cedco",
        actorId: "actor-1",
        correlationId: "corr-1",
        action: "tenant.created",
        resourceType: "tenant",
        resourceId: "cedco",
        result: "success",
        metadata: { phone: "blocked", token: "blocked" },
        occurredAt,
      }),
    );

    expect(mapped.correlationId).toBe("corr-1");
    expect(mapped.metadata.phone).toBe(redactedMetadataValue);
    expect(mapped.metadata.token).toBe(redactedMetadataValue);
  });

  it("Feedback mapper sanitizes metadata", () => {
    const mapped = feedbackEventFromPrisma(
      feedbackEventToPrisma({
        feedbackEventId: "feedback-1",
        tenantId: "cedco",
        actorId: "actor-1",
        correlationId: "corr-1",
        source: "human",
        resourceType: "call",
        resourceId: "call-1",
        outcome: "needs_review",
        score: 0.4,
        metadata: { audioUrl: "blocked" },
        occurredAt,
      }),
    );

    expect(mapped.metadata.audioUrl).toBe(redactedMetadataValue);
  });

  it("Agent mapper preserves tenantId and sanitizes metadata", () => {
    const mapped = agentFromPrisma(
      agentToPrisma({
        agentId: "agent-1",
        tenantId: "cedco",
        name: "CEDCO agent",
        description: "D02",
        status: "draft",
        defaultLocale: "es-CO",
        createdBy: "actor-1",
        createdAt: occurredAt,
        updatedAt: occurredAt,
        metadata: { email: "blocked" },
      }),
    );

    expect(mapped.tenantId).toBe("cedco");
    expect(mapped.metadata.email).toBe(redactedMetadataValue);
  });

  it("PromptVersion mapper preserves template and policy without real secret values", () => {
    const mapped = promptVersionFromPrisma(
      promptVersionToPrisma({
        promptVersionId: "prompt-version-1",
        tenantId: "cedco",
        promptId: "prompt-1",
        versionNumber: 1,
        status: "draft",
        template: "Use synthetic context only.",
        variables: [],
        policy: {
          allowPii: false,
          allowSecrets: false,
          allowProviderSpecificKeys: false,
          allowHardcodedPhoneNumbers: false,
        },
        createdBy: "actor-1",
        createdAt: occurredAt,
      }),
    );

    expect(mapped.template).toBe("Use synthetic context only.");
    expect(mapped.policy.allowSecrets).toBe(false);
  });

  it("KnowledgeDocument mapper sanitizes metadata", () => {
    const mapped = knowledgeDocumentFromPrisma(
      knowledgeDocumentToPrisma({
        documentId: "doc-1",
        tenantId: "cedco",
        knowledgeBaseId: "kb-1",
        title: "Synthetic document",
        sourceType: "manual",
        status: "draft",
        metadata: { documentNumber: "blocked" },
        createdBy: "actor-1",
        createdAt: occurredAt,
      }),
    );

    expect(mapped.metadata.documentNumber).toBe(redactedMetadataValue);
  });

  it("CallSession mapper preserves correlationId and status", () => {
    const mapped = callSessionFromPrisma(
      callSessionToPrisma({
        callId: "call-1",
        tenantId: "cedco",
        direction: "outbound",
        status: "queued",
        participants: [],
        correlationId: "corr-voice",
        metadata: {},
        createdAt: occurredAt,
        updatedAt: occurredAt,
        turns: [],
      }),
    );

    expect(mapped.correlationId).toBe("corr-voice");
    expect(mapped.status).toBe("queued");
  });

  it("ConversationTurn mapper uses contentRedacted", () => {
    const mapped = conversationTurnFromPrisma(
      conversationTurnToPrisma({
        turnId: "turn-1",
        callId: "call-1",
        tenantId: "cedco",
        role: "agent",
        contentRedacted: "Resumen sin PII",
        metadata: {},
        occurredAt,
      }),
    );

    expect(mapped.contentRedacted).toBe("Resumen sin PII");
  });

  it("CallEvent mapper sanitizes metadata", () => {
    const mapped = callEventFromPrisma(
      callEventToPrisma({
        callEventId: "event-1",
        callId: "call-1",
        tenantId: "cedco",
        correlationId: "corr-voice",
        type: "status_changed",
        status: "queued",
        metadata: { rawTranscript: "blocked" },
        occurredAt,
      }),
    );

    expect(mapped.metadata.rawTranscript).toBe(redactedMetadataValue);
  });

  it("Handoff mapper uses redactedSummary", () => {
    const mapped = handoffRequestFromPrisma(
      handoffRequestToPrisma({
        handoffId: "handoff-1",
        tenantId: "cedco",
        callId: "call-1",
        status: "requested",
        priority: "medium",
        reason: "human requested",
        targetQueue: "cedco-general",
        redactedSummary: "Solicita operador.",
        metadata: {},
        createdAt: occurredAt,
      }),
    );

    expect(mapped.redactedSummary).toBe("Solicita operador.");
  });

  it("CEDCO site, service, and agreement mappers preserve allowed references", () => {
    const site = cedcoSiteFromPrisma(
      cedcoSiteToPrisma({
        siteId: "bucaramanga",
        tenantId: "cedco",
        name: "Bucaramanga",
        city: "Bucaramanga",
        status: "active",
        timezone: "America/Bogota",
        metadata: { email: "blocked" },
      }),
    );
    const service = cedcoServiceFromPrisma(
      cedcoServiceToPrisma({
        serviceId: "optometria",
        tenantId: "cedco",
        name: "Optometria",
        category: "orientation",
        availableSiteIds: ["bucaramanga"],
        requiresEligibilityCheck: true,
        requiresSchedulingIntegration: false,
        metadata: {},
      }),
    );
    const agreement = cedcoAgreementFromPrisma(
      cedcoAgreementToPrisma({
        agreementId: "eps-demo",
        tenantId: "cedco",
        name: "EPS demo",
        status: "active",
        applicableServiceIds: ["optometria"],
        metadata: {},
      }),
    );

    expect(site.siteId).toBe("bucaramanga");
    expect(site.metadata.email).toBe(redactedMetadataValue);
    expect(service.availableSiteIds).toEqual(["bucaramanga"]);
    expect(agreement.applicableServiceIds).toEqual(["optometria"]);
  });

  it("CEDCO configuration mapper defaults realCallsEnabled to false", () => {
    const mapped = cedcoD02ConfigurationFromPrisma(
      cedcoD02ConfigurationToPrisma({
        tenantId: "cedco",
        defaultLocale: "es-CO",
        allowedSiteIds: ["bucaramanga"],
        allowedServiceIds: ["optometria"],
        handoffEnabled: true,
        schedulingMode: "mock",
        eligibilityMode: "mock",
        realCallsEnabled: false,
        metadata: {},
      }),
    );

    expect(mapped.realCallsEnabled).toBe(false);
  });

  it("CEDCO metric mapper sanitizes dimensions", () => {
    const mapped = cedcoD02MetricFromPrisma(
      cedcoD02MetricToPrisma({
        metricId: "metric-1",
        tenantId: "cedco",
        key: "readiness_blocked",
        value: 1,
        dimensions: { phone: "blocked" },
        occurredAt,
      }),
    );

    expect(mapped.dimensions.phone).toBe(redactedMetadataValue);
  });
});

describe("Prisma repositories", () => {
  it("implement the main domain ports at typecheck level", () => {
    expect(createRepositoryPortAssertions({})).toHaveLength(23);
  });

  it("repositories do not import product modules outside CEDCO repositories", () => {
    const repositoryFiles = listFiles(path.join(root, "packages/db/src/repositories"));
    const offenders = repositoryFiles.filter((filePath) => {
      const normalized = filePath.replaceAll("\\", "/");
      return (
        !normalized.includes("/products/cedco/d02-calls/") &&
        readFileSync(filePath, "utf8").includes("modules/products")
      );
    });

    expect(offenders).toEqual([]);
  });

  it("repositories do not reference private sources or forbidden persisted fields", () => {
    const privateMarker = ["_", "private"].join("");
    const forbidden = ["phone", "rawTranscript", "audioUrl"];
    const offenders = listFiles(path.join(root, "packages/db/src/repositories")).filter(
      (filePath) => {
        const text = readFileSync(filePath, "utf8");
        return text.includes(privateMarker) || forbidden.some((term) => text.includes(term));
      },
    );

    expect(offenders).toEqual([]);
  });

  it("repositories do not open Prisma connections on import", () => {
    const offenders = listFiles(path.join(root, "packages/db/src/repositories")).filter(
      (filePath) => readFileSync(filePath, "utf8").includes("new PrismaClient"),
    );

    expect(offenders).toEqual([]);
  });
});

describe("persistence architecture checks", () => {
  it("boundary-check passes", () => {
    execFileSync("node", ["tools/boundary-check.mjs"], { cwd: root, stdio: "pipe" });
  });

  it("db-schema-check passes", () => {
    execFileSync("node", ["tools/db-schema-check.mjs"], { cwd: root, stdio: "pipe" });
  });

  it("secret-scan passes", () => {
    execFileSync("node", ["tools/secret-scan.mjs"], { cwd: root, stdio: "pipe" });
  });

  it("pnpm check is wired to database schema validation", () => {
    const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

    expect(packageJson.scripts.check).toContain("db:schema:check");
    expect(packageJson.scripts.check).toContain("db:validate");
    expect(packageJson.scripts.check).toContain("db:generate");
  });
});

function findForbiddenColumns(text) {
  return forbiddenFieldNames.filter((fieldName) => {
    const schemaPattern = new RegExp(`^\\s*${escapeRegExp(fieldName)}\\s+`, "mu");
    const sqlPattern = new RegExp(`"(${escapeRegExp(fieldName)})"\\s+`, "u");
    return schemaPattern.test(text) || sqlPattern.test(text);
  });
}

function extractModel(text, modelName) {
  const pattern = new RegExp(`model\\s+${escapeRegExp(modelName)}\\s+\\{([\\s\\S]*?)\\n\\}`, "u");
  return pattern.exec(text)?.[1] ?? null;
}

function listFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const absoluteEntry = path.join(directory, entry);
    const stats = statSync(absoluteEntry);

    if (stats.isDirectory()) {
      files.push(...listFiles(absoluteEntry));
    } else if (stats.isFile()) {
      files.push(absoluteEntry);
    }
  }

  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
