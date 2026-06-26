import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const ignoredSegments = new Set([".git", "node_modules", "_private", "dist", "build", "coverage"]);

const exactAssignmentNames = [
  ["ELEVENLABS", "API", "KEY"].join("_"),
  ["OPENAI", "API", "KEY"].join("_"),
  ["ANTHROPIC", "API", "KEY"].join("_"),
  ["TWILIO", "AUTH", "TOKEN"].join("_"),
];

const genericAssignmentNames = ["password", "secret", "token"];

const privateKeyMarkers = [
  ["PRIVATE", "KEY"].join("_"),
  ["BEGIN", "RSA", "PRIVATE", "KEY"].join(" "),
  ["BEGIN", "OPENSSH", "PRIVATE", "KEY"].join(" "),
];

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
  "your-key-here",
  "your_token_here",
]);

function listTrackableFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" },
  );

  return output.split("\0").filter(Boolean);
}

function shouldIgnore(filePath) {
  const segments = filePath.split(/[\\/]/u);
  return segments.some((segment) => ignoredSegments.has(segment));
}

function isRealEnvFile(filePath) {
  const baseName = path.basename(filePath);
  return baseName !== ".env.example" && (baseName === ".env" || baseName.startsWith(".env."));
}

function normalizeValue(value) {
  return value
    .trim()
    .replace(/^["']|["']$/gu, "")
    .trim();
}

function looksLikePlaceholder(value) {
  const normalized = normalizeValue(value);
  const lower = normalized.toLowerCase();

  if (placeholderValues.has(lower)) {
    return true;
  }

  return lower.startsWith("<") || lower.startsWith("${") || lower.includes("example");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function findAssignmentIssue(line, names) {
  for (const name of names) {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*([^\\s#;]+)`, "iu");
    const match = pattern.exec(line);

    if (match && !looksLikePlaceholder(match[1] ?? "")) {
      return name;
    }
  }

  return null;
}

function scanText(filePath, text) {
  const issues = [];
  const lines = text.split(/\r?\n/u);

  lines.forEach((line, index) => {
    for (const marker of privateKeyMarkers) {
      if (line.includes(marker)) {
        issues.push(`${filePath}:${index + 1}: private key marker detected`);
      }
    }

    const exactIssue = findAssignmentIssue(line, exactAssignmentNames);
    if (exactIssue) {
      issues.push(`${filePath}:${index + 1}: sensitive assignment detected for ${exactIssue}`);
    }

    const genericIssue = findAssignmentIssue(line, genericAssignmentNames);
    if (genericIssue) {
      issues.push(`${filePath}:${index + 1}: generic sensitive assignment detected`);
    }
  });

  return issues;
}

const issues = [];

for (const filePath of listTrackableFiles()) {
  if (shouldIgnore(filePath)) {
    continue;
  }

  if (isRealEnvFile(filePath)) {
    issues.push(`${filePath}: real environment file must not be tracked`);
    continue;
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const stats = statSync(absolutePath);

  if (!stats.isFile()) {
    continue;
  }

  const text = readFileSync(absolutePath, "utf8");

  if (text.includes("\u0000")) {
    continue;
  }

  issues.push(...scanText(filePath, text));
}

if (issues.length > 0) {
  console.error("Secret scan failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log("Secret scan passed: no obvious secrets found.");
}
