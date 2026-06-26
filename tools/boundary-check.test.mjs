import { describe, expect, it } from "vitest";

import { runBoundaryCheck } from "./boundary-check.mjs";

describe("boundary check", () => {
  it("passes for the current monorepo boundaries", () => {
    expect(runBoundaryCheck()).toEqual([]);
  });
});
