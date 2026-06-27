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

  it("detects tracked external reference repos", () => {
    const issues = runWithFiles({
      "_external/hyperion-dialer-sanitized/README.md": "external",
    });

    expect(issues.some((issue) => issue.includes("external reference repositories"))).toBe(true);
  });

  it("detects CEDCO R03 paths", () => {
    const issues = runWithFiles({
      "modules/products/cedco/r03/index.ts": "export const outOfScope = true;",
    });

    expect(issues.some((issue) => issue.includes("R03"))).toBe(true);
  });

  it("allows the CEDCO D03 fixed assets lane", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/src/index.ts":
        'export const lane = "d03-fixed-assets";',
    });

    expect(issues).toEqual([]);
  });

  it("detects CEDCO assets paths", () => {
    const issues = runWithFiles({
      "modules/products/cedco/assets/index.ts": "export const outOfScope = true;",
    });

    expect(issues.some((issue) => issue.includes("fixed-assets scope"))).toBe(true);
  });

  it("detects CEDCO activos-fijos paths", () => {
    const issues = runWithFiles({
      "modules/products/cedco/activos-fijos/index.ts": "export const outOfScope = true;",
    });

    expect(issues.some((issue) => issue.includes("activos-fijos"))).toBe(true);
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

  it("detects D03 importing D02", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/src/cross.ts":
        'import { something } from "../d02-calls";\nexport { something };',
    });

    expect(issues.some((issue) => issue.includes("D03 must not import D02"))).toBe(true);
  });

  it("detects D03 importing voice", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/src/voice.ts":
        'import { something } from "modules/voice";\nexport { something };',
    });

    expect(issues.some((issue) => issue.includes("D03 must not import voice"))).toBe(true);
  });

  it("detects D03 importing providers", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/src/provider.ts":
        'import client from "twilio";\nexport { client };',
    });

    expect(issues.some((issue) => issue.includes("real provider import"))).toBe(true);
  });

  it("detects process.env in D03", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/src/env.ts": "export const v = process.env.TEST;",
    });

    expect(issues.some((issue) => issue.includes("process.env"))).toBe(true);
  });

  it("detects _private references in D03", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/src/private.ts":
        'export const path = "_private/source-docs";',
    });

    expect(issues.some((issue) => issue.includes("_private"))).toBe(true);
  });

  it("detects D03 real file upload fixtures", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/fixtures/inventory.xlsx": "binary",
    });

    expect(issues.some((issue) => issue.includes("D03 real asset/import files"))).toBe(true);
  });

  it("allows D03 README and docs", () => {
    const issues = runWithFiles({
      "modules/products/cedco/d03-fixed-assets/README.md":
        "D03 fixed assets lane docs mention imports and exports conceptually.",
      "docs/product/CEDCO_D03_PRODUCT_SCOPE.md": "D03 docs may mention assets and fixed assets.",
    });

    expect(issues).toEqual([]);
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

  it("detects active demo dialer endpoint in API source", () => {
    const issues = runWithFiles({
      "apps/api/src/routes/bad.ts": 'export const route = "/api/demo/call";',
    });

    expect(issues.some((issue) => issue.includes("active dialer"))).toBe(true);
  });

  it("detects active campaign start endpoint in API source", () => {
    const issues = runWithFiles({
      "apps/api/src/routes/bad.ts": 'export const route = "/api/campaigns/campaign-id/start";',
    });

    expect(issues.some((issue) => issue.includes("active dialer"))).toBe(true);
  });

  it("detects fetch in internal dialer adapter", () => {
    const issues = runWithFiles({
      "modules/integrations/provider-adapters/internal-dialer/src/client.ts":
        "export async function call() { return fetch('/api/demo/call'); }",
    });

    expect(issues.some((issue) => issue.includes("network fetches"))).toBe(true);
  });

  it("detects provider import in internal dialer adapter", () => {
    const issues = runWithFiles({
      "modules/integrations/provider-adapters/internal-dialer/src/provider.ts":
        'import client from "elevenlabs";\nexport { client };',
    });

    expect(issues.some((issue) => issue.includes("must not import providers"))).toBe(true);
  });

  it("detects real dialer env key references in internal dialer adapter", () => {
    const issues = runWithFiles({
      "modules/integrations/provider-adapters/internal-dialer/src/env.ts":
        'export const keyName = "DEMO_API_KEY";',
    });

    expect(issues.some((issue) => issue.includes("dialer env keys"))).toBe(true);
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
