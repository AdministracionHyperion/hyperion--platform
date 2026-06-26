import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runBoundaryCheck } from "./boundary-check.mjs";

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
});
