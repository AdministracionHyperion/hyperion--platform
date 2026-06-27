import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const apiRoot = join(repoRoot, "apps", "api");
const apiSrcRoot = join(apiRoot, "src");
const apiTestsRoot = join(apiSrcRoot, "tests");

function listFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root).flatMap((entry) => {
    const fullPath = join(root, entry);
    const stat = statSync(fullPath);
    return stat.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

describe("API architecture gates", () => {
  it("package check script covers repo guard and tests", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.check).toContain("pnpm run test");
    expect(packageJson.scripts.check).toContain("pnpm run repo:guard");
  });

  it("repo guard passes for the current repository", () => {
    expect(() =>
      execFileSync("node", ["tools/repo-guard.mjs"], { cwd: repoRoot, stdio: "pipe" }),
    ).not.toThrow();
  });

  it("does not import blocked external providers in apps/api", () => {
    const content = listFiles(apiSrcRoot)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toMatch(
      /from\s+["'](?:elevenlabs|openai|anthropic|twilio|telnyx|plivo|vonage)/iu,
    );
  });

  it("does not start a listening server in API tests", () => {
    const content = listFiles(apiTestsRoot)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toMatch(/\.listen\s*\(/u);
  });

  it("does not use real database wiring in API tests", () => {
    const content = listFiles(apiTestsRoot)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(content).not.toContain(["Prisma", "Client"].join(""));
    expect(content).not.toContain(["postgresql", "://"].join(""));
  });
});
