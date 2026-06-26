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
    denied: ["modules/products"],
    message: "modules/agent-platform must not import products",
  },
  {
    from: "modules/voice",
    denied: ["modules/products"],
    message: "modules/voice must not import products",
  },
];

const providerImportPatterns = [
  "elevenlabs",
  "@elevenlabs",
  "twilio",
  "freeswitch",
  "kamailio",
  "asterisk",
  "sip-provider",
  "siptrunk",
  "sip-trunk-adapter",
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
    }
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
