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
});
