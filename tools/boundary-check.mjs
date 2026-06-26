import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();

const restrictedRoots = [
  "modules/core",
  "modules/agent-platform",
  "modules/voice",
  "modules/products/cedco/d02-calls",
];

const importRules = [
  {
    from: "modules/core",
    denied: ["modules/products", "modules/integrations"],
    message: "modules/core must not import products or integrations",
  },
  {
    from: "modules/agent-platform",
    denied: ["modules/products", "modules/integrations/provider-adapters"],
    message: "modules/agent-platform must not import products or provider adapters",
  },
  {
    from: "modules/voice",
    denied: ["modules/products", "modules/integrations/provider-adapters"],
    message: "modules/voice must not import products or provider adapters",
  },
  {
    from: "modules/products/cedco/d02-calls",
    denied: ["modules/integrations/provider-adapters"],
    message: "modules/products/cedco/d02-calls must not import provider adapters",
  },
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
  "freeswitch",
  "kamailio",
  "asterisk",
  "sip-provider",
  "siptrunk",
  "sip-trunk-adapter",
  "sip.js",
  "jssip",
  "drachtio",
];

const vectorDbImportPatterns = [
  "pinecone",
  "weaviate",
  "qdrant",
  "chromadb",
  "milvus",
  "pgvector",
  "vectordb",
  "vector-db",
];

const realIngestionImports = ["fs", "node:fs", "fs/promises", "node:fs/promises"];
const realNetworkImports = [
  "http",
  "https",
  "node:http",
  "node:https",
  "net",
  "node:net",
  "dgram",
  "node:dgram",
  "ws",
  "websocket",
];

export function runBoundaryCheck() {
  const issues = [];

  for (const rule of importRules) {
    for (const filePath of listSourceFiles(rule.from)) {
      const imports = readImports(filePath);

      for (const importTarget of imports) {
        const resolved = resolveImportPath(filePath, importTarget);
        if (resolved && rule.denied.some((denied) => normalizePath(resolved).startsWith(denied))) {
          issues.push(`${filePath}: ${rule.message}`);
        }
      }
    }
  }

  for (const rootPath of restrictedRoots) {
    for (const filePath of listSourceFiles(rootPath)) {
      const text = readFileSync(path.join(root, filePath), "utf8");
      const imports = readImports(filePath);

      for (const importTarget of imports) {
        const lower = importTarget.toLowerCase();
        if (providerImportPatterns.some((pattern) => lower.includes(pattern))) {
          issues.push(`${filePath}: provider import is not allowed yet (${importTarget})`);
        }
      }

      if (rootPath === "modules/core" && text.includes("process.env")) {
        issues.push(`${filePath}: process.env is not allowed in core domain`);
      }

      if (rootPath === "modules/agent-platform") {
        if (text.includes("process.env")) {
          issues.push(`${filePath}: process.env is not allowed in agent-platform domain`);
        }

        if (text.includes("_private")) {
          issues.push(`${filePath}: agent-platform must not read private source documents`);
        }

        for (const importTarget of imports) {
          if (realIngestionImports.includes(importTarget)) {
            issues.push(`${filePath}: filesystem ingestion is not allowed in agent-platform yet`);
          }
        }
      }

      if (
        rootPath === "modules/agent-platform" &&
        filePath.startsWith("modules/agent-platform/knowledge-rag/")
      ) {
        for (const importTarget of imports) {
          const lower = importTarget.toLowerCase();
          if (vectorDbImportPatterns.some((pattern) => lower.includes(pattern))) {
            issues.push(
              `${filePath}: real vector database imports are not allowed yet (${importTarget})`,
            );
          }
        }
      }

      if (
        rootPath === "modules/agent-platform" &&
        filePath.startsWith("modules/agent-platform/evals/")
      ) {
        for (const importTarget of imports) {
          const lower = importTarget.toLowerCase();
          if (
            ["langchain", "llamaindex", "openai", "anthropic"].some((pattern) =>
              lower.includes(pattern),
            )
          ) {
            issues.push(
              `${filePath}: real LLM imports are not allowed in evals yet (${importTarget})`,
            );
          }
        }
      }

      if (rootPath === "modules/voice") {
        if (text.includes("process.env")) {
          issues.push(`${filePath}: process.env is not allowed in voice domain`);
        }

        if (text.includes("_private")) {
          issues.push(`${filePath}: voice domain must not read private source documents`);
        }

        if (/\bfetch\s*\(/u.test(text)) {
          issues.push(`${filePath}: fetch is not allowed in voice domain`);
        }

        if (/adapter/iu.test(path.basename(filePath))) {
          issues.push(`${filePath}: real adapters are not allowed in voice domain`);
        }

        for (const importTarget of imports) {
          const lower = importTarget.toLowerCase();
          if (realNetworkImports.includes(lower)) {
            issues.push(
              `${filePath}: real network imports are not allowed in voice domain (${importTarget})`,
            );
          }
        }
      }

      if (rootPath === "modules/products/cedco/d02-calls") {
        if (text.includes("process.env")) {
          issues.push(`${filePath}: process.env is not allowed in CEDCO D02 domain`);
        }

        if (text.includes("_private")) {
          issues.push(`${filePath}: CEDCO D02 domain must not read private source documents`);
        }

        if (/\bfetch\s*\(/u.test(text)) {
          issues.push(`${filePath}: fetch is not allowed in CEDCO D02 domain`);
        }

        if (/\bR03\b|activos[-_ ]?fijos|assets/iu.test(text)) {
          issues.push(`${filePath}: CEDCO D02 must not implement R03 or fixed-assets scope`);
        }

        for (const importTarget of imports) {
          const lower = importTarget.toLowerCase();
          if (realNetworkImports.includes(lower)) {
            issues.push(
              `${filePath}: real network imports are not allowed in CEDCO D02 domain (${importTarget})`,
            );
          }

          if (realIngestionImports.includes(lower)) {
            issues.push(
              `${filePath}: filesystem ingestion is not allowed in CEDCO D02 domain (${importTarget})`,
            );
          }
        }
      }
    }
  }

  if (existsDirectory(path.join(root, "modules/products/cedco/r03"))) {
    issues.push("modules/products/cedco/r03 must not exist in this scope");
  }

  if (existsDirectory(path.join(root, "modules/products/cedco/assets"))) {
    issues.push("modules/products/cedco/assets must not exist in this scope");
  }

  return issues;
}

function listSourceFiles(relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot);
  const files = [];

  if (!existsDirectory(absoluteRoot)) {
    return files;
  }

  walk(absoluteRoot, files);
  return files.map((filePath) => normalizePath(path.relative(root, filePath)));
}

function walk(directory, files) {
  for (const entry of readdirSync(directory)) {
    const absoluteEntry = path.join(directory, entry);
    const stats = statSync(absoluteEntry);

    if (stats.isDirectory()) {
      walk(absoluteEntry, files);
      continue;
    }

    if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      files.push(absoluteEntry);
    }
  }
}

function existsDirectory(directory) {
  try {
    return statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

function readImports(filePath) {
  const text = readFileSync(path.join(root, filePath), "utf8");
  const imports = [];
  const importPattern = /\bimport(?:\s+type)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gu;

  for (const match of text.matchAll(importPattern)) {
    imports.push(match[1]);
  }

  return imports;
}

function resolveImportPath(filePath, importTarget) {
  if (!importTarget.startsWith(".")) {
    return null;
  }

  const absolute = path.resolve(root, path.dirname(filePath), importTarget);
  return path.relative(root, absolute);
}

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const issues = runBoundaryCheck();

  if (issues.length > 0) {
    console.error("Boundary check failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Boundary check passed.");
  }
}
