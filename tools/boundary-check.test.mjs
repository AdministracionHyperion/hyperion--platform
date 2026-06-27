import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runBoundaryCheck, runBoundaryCheckForFiles } from "./boundary-check.mjs";

describe("boundary check", () => {
  it("passes for the current monorepo boundaries", () => {
    expect(runBoundaryCheck()).toEqual([]);
  });

  it("keeps real voice providers out of modules/voice", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("elevenlabs");
    expect(output).toContain("twilio");
    expect(output).toContain("openai");
    expect(output).toContain("anthropic");
    expect(output).toContain("telnyx");
    expect(output).toContain("plivo");
    expect(output).toContain("vonage");
  });

  it("keeps process.env out of modules/voice through boundary rules", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("process.env is not allowed in voice domain");
  });

  it("keeps CEDCO D02 isolated from providers, runtime, and adjacent product scopes", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("modules/products/cedco/d02-calls");
    expect(output).toContain("CEDCO D02 domain must not read private source documents");
    expect(output).toContain("CEDCO D02 must not implement R03 or fixed-assets scope");
    expect(output).toContain("modules/products/cedco/r03 must not exist");
  });

  it("keeps real provider imports out of CEDCO D02 through shared provider rules", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("elevenlabs");
    expect(output).toContain("twilio");
    expect(output).toContain("openai");
    expect(output).toContain("anthropic");
  });

  it("keeps process.env out of CEDCO D02 through boundary rules", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("process.env is not allowed in CEDCO D02 domain");
  });

  it("asserts adjacent CEDCO fixed-assets modules are absent", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("modules/products/cedco/r03 must not exist");
    expect(output).toContain("modules/products/cedco/assets must not exist");
  });

  it("keeps CEDCO D03 in restricted architecture roots", () => {
    const output = readFileSync(join(process.cwd(), "tools", "boundary-check.mjs"), "utf8");

    expect(output).toContain("modules/products/cedco/d03-fixed-assets");
    expect(output).toContain("process.env is not allowed in CEDCO D03 domain");
    expect(output).toContain("fetch is not allowed in CEDCO D03 domain");
  });

  it("fails D03 imports from D02", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/cross.ts":
        'import { value } from "../../d02-calls/src";\nexport { value };',
    });

    expect(issues.some((issue) => issue.includes("must not import D02"))).toBe(true);
  });

  it("fails D03 imports from voice", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/voice.ts":
        'import { value } from "../../../../voice/src";\nexport { value };',
    });

    expect(issues.some((issue) => issue.includes("must not import D02, voice, or providers"))).toBe(
      true,
    );
  });

  it("fails D03 provider imports", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/provider.ts":
        'import value from "twilio";\nexport { value };',
    });

    expect(issues.some((issue) => issue.includes("provider import is not allowed"))).toBe(true);
  });

  it("fails D03 fetch usage", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/fetch.ts":
        "export async function load() { return fetch('/internal'); }",
    });

    expect(issues.some((issue) => issue.includes("fetch is not allowed in CEDCO D03"))).toBe(true);
  });

  it("fails D03 process.env usage", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/env.ts": "export const value = process.env.X;",
    });

    expect(issues.some((issue) => issue.includes("process.env is not allowed in CEDCO D03"))).toBe(
      true,
    );
  });

  it("fails D03 filesystem imports", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/files.ts":
        'import { readFile } from "node:fs";\nexport { readFile };',
    });

    expect(issues.some((issue) => issue.includes("filesystem imports are not allowed"))).toBe(true);
  });

  it("allows safe D03 domain files", () => {
    const issues = runBoundaryCheckForFiles({
      "modules/products/cedco/d03-fixed-assets/src/safe.ts":
        'import type { SafeMetadata } from "../../../../../packages/shared/src/core";\nexport type Local = SafeMetadata;',
    });

    expect(issues).toEqual([]);
  });
});
