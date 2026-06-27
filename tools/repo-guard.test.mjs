import { describe, expect, it } from "vitest";

import { runRepoGuard } from "./repo-guard.mjs";

const baseFiles = {
  "package.json": '{"scripts":{"check":"pnpm check"}}',
  "packages/db/prisma/schema.prisma": "model Tenant {\n  id String @id\n  name String\n}\n",
};

describe("repo guard", () => {
  it("passes in the current repo", () => {
    expect(runRepoGuard()).toEqual([]);
  });

  it("detects tracked private files", () => {
    const issues = runWithFiles({
      "_private/source-docs/R02.docx": "private",
    });

    expect(issues.some((issue) => issue.includes("private source files"))).toBe(true);
  });

  it("detects CEDCO R03 paths", () => {
    const issues = runWithFiles({
      "modules/products/cedco/r03/index.ts": "export const outOfScope = true;",
    });

    expect(issues.some((issue) => issue.includes("R03"))).toBe(true);
  });

  it("detects real env files", () => {
    const issues = runWithFiles({
      ".env.local": "EXAMPLE=value",
    });

    expect(issues.some((issue) => issue.includes("real environment files"))).toBe(true);
  });

  it("detects tracked Word documents", () => {
    const issues = runWithFiles({
      "docs/private-reference.docx": "binary",
    });

    expect(issues.some((issue) => issue.includes("Word documents"))).toBe(true);
  });

  it("detects real provider imports in restricted domains", () => {
    const issues = runWithFiles({
      "modules/voice/telephony/src/provider.ts":
        'import client from "elevenlabs";\nexport { client };',
    });

    expect(issues.some((issue) => issue.includes("real provider import"))).toBe(true);
  });

  it("detects process.env in restricted domains", () => {
    const issues = runWithFiles({
      "modules/core/tenancy/src/env.ts": "export const value = process.env.TEST;",
    });

    expect(issues.some((issue) => issue.includes("process.env"))).toBe(true);
  });

  it("detects hardcoded database URLs", () => {
    const issues = runWithFiles({
      "packages/db/src/config.ts":
        'export const url = "postgresql://user:pass@db.example/hyperion";',
    });

    expect(issues.some((issue) => issue.includes("DATABASE_URL"))).toBe(true);
  });

  it("detects forbidden Prisma columns", () => {
    const issues = runWithFiles({
      "packages/db/prisma/schema.prisma":
        "model CallSession {\n  id String @id\n  phoneNumber String\n}\n",
    });

    expect(issues.some((issue) => issue.includes("forbidden Prisma column"))).toBe(true);
  });

  it("detects Redis or BullMQ imports before worker loop", () => {
    const issues = runWithFiles({
      "apps/api/src/cache.ts": 'import Redis from "ioredis";\nexport { Redis };',
    });

    expect(issues.some((issue) => issue.includes("real provider import"))).toBe(true);
  });

  it("detects dangerous runtime flags hardcoded true", () => {
    const issues = runWithFiles({
      "apps/api/src/configuration.ts": "export const config = { realCallsEnabled: true };",
    });

    expect(issues.some((issue) => issue.includes("realCallsEnabled=true"))).toBe(true);
  });
});

function runWithFiles(extraFiles) {
  const files = { ...baseFiles, ...extraFiles };

  return runRepoGuard({
    trackedFiles: Object.keys(files),
    readText: (filePath) => files[filePath] ?? "",
    pathExists: (filePath) =>
      Object.keys(files).some((trackedFile) => trackedFile.startsWith(`${filePath}/`)),
  });
}
