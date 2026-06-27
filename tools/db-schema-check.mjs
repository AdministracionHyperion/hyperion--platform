import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "packages/db/prisma/schema.prisma");
const migrationPath = path.join(
  root,
  "packages/db/prisma/migrations/0001_initial_hyperion_platform/migration.sql",
);

const forbiddenFields = [
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

const forbiddenTerms = [
  "_private",
  "ElevenLabs",
  "Twilio",
  "OpenAI",
  "Anthropic",
  "R03",
  "activos-fijos",
  "activos_fijos",
];

const tenantModels = [
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

const correlationModels = ["AuditLog", "FeedbackEvent", "OutboxEvent", "CallSession", "CallEvent"];

const issues = [];
const schema = readText(schemaPath);
const migration = readText(migrationPath);

checkForbiddenColumns(schema, "schema.prisma");
checkForbiddenColumns(migration, "migration.sql");
checkForbiddenTerms(schema, "schema.prisma");
checkForbiddenTerms(migration, "migration.sql");
checkModels();
checkNoRealDatabaseUrl();

if (issues.length > 0) {
  console.error("DB schema check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log("DB schema check passed.");
}

function readText(filePath) {
  try {
    if (!statSync(filePath).isFile()) {
      issues.push(`${path.relative(root, filePath)} is not a file`);
      return "";
    }
    return readFileSync(filePath, "utf8");
  } catch {
    issues.push(`${path.relative(root, filePath)} is missing`);
    return "";
  }
}

function checkForbiddenColumns(text, label) {
  for (const field of forbiddenFields) {
    const schemaPattern = new RegExp(`^\\s*${escapeRegExp(field)}\\s+`, "mu");
    const sqlPattern = new RegExp(`"(${escapeRegExp(field)})"\\s+`, "u");
    if (schemaPattern.test(text) || sqlPattern.test(text)) {
      issues.push(`${label} contains forbidden column ${field}`);
    }
  }
}

function checkForbiddenTerms(text, label) {
  for (const term of forbiddenTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      issues.push(`${label} contains forbidden term ${term}`);
    }
  }
}

function checkModels() {
  for (const modelName of tenantModels) {
    const model = extractModel(schema, modelName);
    if (!model) {
      issues.push(`model ${modelName} is missing`);
      continue;
    }
    if (!/^\s*tenantId\s+String\??/mu.test(model)) {
      issues.push(`model ${modelName} must include tenantId`);
    }
  }

  for (const modelName of correlationModels) {
    const model = extractModel(schema, modelName);
    if (model && !/^\s*correlationId\s+String/mu.test(model)) {
      issues.push(`model ${modelName} must include correlationId`);
    }
  }

  for (const forbiddenModel of ["R03", "Asset", "ActivosFijos"]) {
    if (new RegExp(`model\\s+${forbiddenModel}\\b`, "u").test(schema)) {
      issues.push(`forbidden model ${forbiddenModel} exists`);
    }
  }
}

function checkNoRealDatabaseUrl() {
  const realUrlPattern =
    /postgres(?:ql)?:\/\/(?!placeholder:placeholder@localhost:5432\/hyperion)/iu;
  if (realUrlPattern.test(schema) || realUrlPattern.test(migration)) {
    issues.push("schema or migration contains a concrete PostgreSQL URL");
  }
}

function extractModel(text, modelName) {
  const pattern = new RegExp(`model\\s+${escapeRegExp(modelName)}\\s+\\{([\\s\\S]*?)\\n\\}`, "u");
  return pattern.exec(text)?.[1] ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
