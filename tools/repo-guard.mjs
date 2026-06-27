import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = process.cwd();

const restrictedSourceRoots = [
  "apps/api/",
  "apps/workers/",
  "modules/core/",
  "modules/agent-platform/",
  "modules/voice/",
  "modules/products/cedco/d02-calls/",
  "packages/db/",
  "packages/observability/",
];

const domainRoots = [
  "modules/core/",
  "modules/agent-platform/",
  "modules/voice/",
  "modules/products/cedco/d02-calls/",
];

const providerImportPatterns = [
  "elevenlabs",
  "@elevenlabs",
  "openai",
  "@openai",
  "anthropic",
  "@anthropic",
  "twilio",
  "telnyx",
  "plivo",
  "vonage",
  "sentry",
  "@sentry",
  "datadog",
  "newrelic",
  "@opentelemetry/exporter",
  "@opentelemetry/sdk",
  "redis",
  "ioredis",
  "bullmq",
  "axios",
  "got",
  "node-fetch",
];

const dangerousRuntimeFlags = [
  "realCallsEnabled",
  "providerEgressEnabled",
  "productionDeployEnabled",
  "rawTranscriptEnabled",
  "rawRecordingEnabled",
];

const networkImports = [
  "http",
  "https",
  "node:http",
  "node:https",
  "net",
  "node:net",
  "dgram",
  "node:dgram",
  "ws",
];

const forbiddenPrismaColumns = ["rawTranscript", "audioUrl", "recordingUrl", "phoneNumber"];
const sensitiveAssignmentNames = ["secret", "token", "password", "apiKey"];
const placeholderValues = new Set([
  "",
  "example",
  "placeholder",
  "changeme",
  "change_me",
  "todo",
  "tbd",
  "redacted",
  "dummy",
  "not_set",
  "unset",
  "your_value_here",
  "hyperion_test",
]);

const allowedDatabaseUrls = new Set([
  "postgresql://placeholder:placeholder@localhost:5432/hyperion",
  "postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public",
]);

export function runRepoGuard(options = {}) {
  const root = options.root ?? defaultRoot;
  const trackedFiles = options.trackedFiles ?? listTrackedFiles(root);
  const readText =
    options.readText ?? ((filePath) => readFileSync(path.join(root, filePath), "utf8"));
  const pathExists = options.pathExists ?? ((filePath) => existsSync(path.join(root, filePath)));
  const issues = [];

  validateTrackedFileList(trackedFiles, issues);
  validateForbiddenProductPaths(pathExists, trackedFiles, issues);
  validateTrackedFileContents(trackedFiles, readText, issues);

  return issues;
}

function validateTrackedFileList(trackedFiles, issues) {
  for (const filePath of trackedFiles.map(normalizePath)) {
    const lower = filePath.toLowerCase();
    const baseName = path.posix.basename(lower);

    if (lower.startsWith("_private/")) {
      issues.push(`${filePath}: private source files must not be tracked`);
    }

    if (lower.startsWith("modules/products/cedco/r03/")) {
      issues.push(`${filePath}: CEDCO R03 is out of scope`);
    }

    if (lower.startsWith("modules/products/cedco/assets/")) {
      issues.push(`${filePath}: CEDCO fixed-assets scope is out of scope`);
    }

    if (lower.startsWith("modules/products/cedco/activos-fijos/")) {
      issues.push(`${filePath}: CEDCO activos-fijos scope is out of scope`);
    }

    if (baseName === ".env" || baseName === ".env.local" || baseName === ".env.production") {
      issues.push(`${filePath}: real environment files must not be tracked`);
    }

    if (
      lower.startsWith("node_modules/") ||
      lower.startsWith("dist/") ||
      lower.startsWith("build/") ||
      lower.startsWith("coverage/")
    ) {
      issues.push(`${filePath}: generated dependency/build output must not be tracked`);
    }

    if (lower.endsWith(".docx")) {
      issues.push(`${filePath}: Word documents must not be tracked`);
    }

    if (lower.endsWith(".zip")) {
      issues.push(`${filePath}: zip archives must not be tracked`);
    }

    if (lower.endsWith(".pdf")) {
      issues.push(`${filePath}: PDF files require explicit future authorization before tracking`);
    }
  }
}

function validateForbiddenProductPaths(pathExists, trackedFiles, issues) {
  for (const forbiddenPath of [
    "modules/products/cedco/r03",
    "modules/products/cedco/assets",
    "modules/products/cedco/activos-fijos",
  ]) {
    if (
      pathExists(forbiddenPath) ||
      trackedFiles.map(normalizePath).some((file) => file.startsWith(`${forbiddenPath}/`))
    ) {
      issues.push(`${forbiddenPath}: out-of-scope product path must not exist`);
    }
  }
}

function validateTrackedFileContents(trackedFiles, readText, issues) {
  for (const filePath of trackedFiles.map(normalizePath)) {
    if (!shouldInspectContent(filePath)) {
      continue;
    }

    const text = safeRead(readText, filePath);
    if (text === null || text.includes("\u0000")) {
      continue;
    }

    validateSourceBoundaries(filePath, text, issues);
    validateApiBoundaries(filePath, text, issues);
    validateDatabaseUrls(filePath, text, issues);
    validateSensitiveAssignments(filePath, text, issues);
    validateRuntimeFlags(filePath, text, issues);
  }
}

function validateSourceBoundaries(filePath, text, issues) {
  if (!restrictedSourceRoots.some((root) => filePath.startsWith(root))) {
    return;
  }

  const imports = readImports(text);
  for (const importTarget of imports) {
    const lower = importTarget.toLowerCase();
    if (providerImportPatterns.some((pattern) => lower.includes(pattern))) {
      issues.push(`${filePath}: real provider import is not allowed (${importTarget})`);
    }
  }

  if (
    text.includes(["process", "env"].join(".")) &&
    !isDbIntegrationPath(filePath) &&
    !isApiRuntimeConfigPath(filePath)
  ) {
    issues.push(`${filePath}: process.env is not allowed in domain or packages/db`);
  }

  if (domainRoots.some((root) => filePath.startsWith(root))) {
    if (/\bfetch\s*\(/u.test(text)) {
      issues.push(`${filePath}: fetch is not allowed in domain`);
    }

    for (const importTarget of imports) {
      const lower = importTarget.toLowerCase();
      if (networkImports.includes(lower)) {
        issues.push(`${filePath}: real network import is not allowed (${importTarget})`);
      }
    }
  }

  validateWorkerBoundaries(filePath, text, imports, issues);

  if (filePath === "packages/db/prisma/schema.prisma" || filePath.endsWith("/migration.sql")) {
    for (const column of forbiddenPrismaColumns) {
      const schemaPattern = new RegExp(`^\\s*${escapeRegExp(column)}\\s+`, "mu");
      const sqlPattern = new RegExp(`"(${escapeRegExp(column)})"\\s+`, "u");
      if (schemaPattern.test(text) || sqlPattern.test(text)) {
        issues.push(`${filePath}: forbidden Prisma column detected (${column})`);
      }
    }
  }
}

function validateWorkerBoundaries(filePath, text, imports, issues) {
  if (!filePath.startsWith("apps/workers/")) {
    return;
  }

  if (text.includes("DATABASE_URL")) {
    issues.push(`${filePath}: workers must not read DATABASE_URL directly`);
  }

  if (text.includes(["process", "env"].join("."))) {
    issues.push(`${filePath}: process.env is not allowed in worker contracts`);
  }

  if (/\bsetInterval\s*\(/u.test(text)) {
    issues.push(`${filePath}: worker foundation must not create daemon intervals`);
  }

  if (/\bwhile\s*\(\s*true\s*\)/u.test(text) || /\bfor\s*\(\s*;\s*;\s*\)/u.test(text)) {
    issues.push(`${filePath}: worker foundation must not create infinite loops`);
  }

  if (/\.listen\s*\(/u.test(text)) {
    issues.push(`${filePath}: workers must not start listeners`);
  }

  if (/\bfetch\s*\(/u.test(text)) {
    issues.push(`${filePath}: workers must not perform network fetches`);
  }

  for (const importTarget of imports) {
    const lower = importTarget.toLowerCase();
    if (networkImports.includes(lower)) {
      issues.push(`${filePath}: workers must not import real network modules (${importTarget})`);
    }
  }

  if (
    /\b(call\.dispatch\.real|provider\.egress\.real|elevenlabs\.call|sip\.dispatch)\b/iu.test(
      text,
    ) &&
    !isTestPath(filePath)
  ) {
    issues.push(`${filePath}: worker job contracts must not define real provider dispatch jobs`);
  }
}

function validateApiBoundaries(filePath, text, issues) {
  if (!filePath.startsWith("apps/api/")) {
    return;
  }

  if (filePath.startsWith("apps/api/src/tests/") && /\.listen\s*\(/u.test(text)) {
    issues.push(`${filePath}: API tests must use injection and must not start listeners`);
  }

  if (
    !filePath.startsWith("apps/api/src/tests/") &&
    /\b(?:dispatchOutboundCall|outbound-call|sip_call_id|conversation_id)\b/iu.test(text)
  ) {
    issues.push(`${filePath}: API skeleton must not expose real call dispatch/provider fields`);
  }

  if (
    !isTestPath(filePath) &&
    /["'`]\/api\/[^"'`]*(?:\/dispatch|\/real-call|\/provider-egress|\/elevenlabs|\/sip)\b/iu.test(
      text,
    )
  ) {
    issues.push(`${filePath}: API must not expose real dispatch or provider routes`);
  }

  if (
    !isTestPath(filePath) &&
    /https?:\/\/[^"'\s]*(?:elevenlabs|twilio|telnyx|plivo|vonage|sip)[^"'\s]*/iu.test(text)
  ) {
    issues.push(`${filePath}: real provider URLs are not allowed`);
  }

  if (filePath.startsWith("apps/api/src/contracts/")) {
    for (const field of [
      "phoneNumber",
      "to_number",
      "from_number",
      "rawTranscript",
      "transcript",
      "audioUrl",
      "recordingUrl",
    ]) {
      const acceptedFieldPattern = new RegExp(`${escapeRegExp(field)}\\s*:`, "u");
      if (acceptedFieldPattern.test(text)) {
        issues.push(`${filePath}: forbidden API request field must not be accepted (${field})`);
      }
    }
  }
}

function validateDatabaseUrls(filePath, text, issues) {
  const databaseUrlPattern = /postgres(?:ql)?:\/\/[^\s"')]+/giu;
  for (const match of text.matchAll(databaseUrlPattern)) {
    if (!allowedDatabaseUrls.has(match[0])) {
      issues.push(`${filePath}: concrete DATABASE_URL must not be hardcoded`);
    }
  }
}

function validateSensitiveAssignments(filePath, text, issues) {
  if (isConceptOnlyPath(filePath) || isTestPath(filePath) || filePath === "package.json") {
    return;
  }

  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    for (const name of sensitiveAssignmentNames) {
      const pattern = new RegExp(`\\b${escapeRegExp(name)}\\s*[:=]\\s*["']?([^"',\\s#}]+)`, "iu");
      const match = pattern.exec(line);
      if (match && !looksLikePlaceholder(match[1] ?? "")) {
        issues.push(
          `${filePath}:${index + 1}: sensitive assignment appears to contain a real value`,
        );
      }
    }
  }
}

function validateRuntimeFlags(filePath, text, issues) {
  if (isConceptOnlyPath(filePath) || isTestPath(filePath) || isPolicyGateDefinitionPath(filePath)) {
    return;
  }

  for (const flag of dangerousRuntimeFlags) {
    const enabledPattern = new RegExp(`\\b${escapeRegExp(flag)}\\s*[:=]\\s*true\\b`, "u");
    if (enabledPattern.test(text)) {
      issues.push(`${filePath}: ${flag}=true is not allowed outside tests or policy blockers`);
    }
  }
}

function isTestPath(filePath) {
  return /\.test\.[cm]?[jt]s$/u.test(filePath);
}

function isDbIntegrationPath(filePath) {
  return filePath.startsWith("packages/db/src/integration/");
}

function isApiRuntimeConfigPath(filePath) {
  return (
    filePath === "apps/api/src/config/api-config.ts" ||
    filePath === "apps/api/src/main.ts" ||
    filePath.startsWith("apps/api/src/integration/")
  );
}

function isPolicyGateDefinitionPath(filePath) {
  return (
    filePath.startsWith("modules/core/policy-gates/") ||
    filePath.startsWith("modules/core/rate-limits/") ||
    filePath.startsWith("apps/api/src/security/")
  );
}

function shouldInspectContent(filePath) {
  if (isConceptOnlyPath(filePath)) {
    return false;
  }

  return (
    filePath.endsWith(".ts") ||
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".js") ||
    filePath.endsWith(".mjs") ||
    filePath.endsWith(".json") ||
    filePath.endsWith(".prisma") ||
    filePath.endsWith(".sql") ||
    filePath.endsWith(".yml") ||
    filePath.endsWith(".yaml")
  );
}

function isConceptOnlyPath(filePath) {
  return (
    filePath.startsWith("docs/") ||
    filePath.startsWith("tools/") ||
    filePath === "pnpm-lock.yaml" ||
    filePath.endsWith(".md")
  );
}

function safeRead(readText, filePath) {
  try {
    return readText(filePath);
  } catch {
    return null;
  }
}

function readImports(text) {
  const imports = [];
  const importPattern = /\bimport(?:\s+type)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gu;

  for (const match of text.matchAll(importPattern)) {
    imports.push(match[1]);
  }

  return imports;
}

function listTrackedFiles(root) {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  return output.split("\0").filter(Boolean);
}

function looksLikePlaceholder(value) {
  const normalized = value
    .trim()
    .replace(/^["']|["']$/gu, "")
    .trim()
    .toLowerCase();

  return (
    placeholderValues.has(normalized) ||
    normalized.startsWith("<") ||
    normalized.startsWith("${") ||
    normalized.includes("example")
  );
}

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const issues = runRepoGuard();

  if (issues.length > 0) {
    console.error("Repo guard failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Repo guard passed.");
  }
}
