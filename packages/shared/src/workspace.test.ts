import { describe, expect, it } from "vitest";

import { sharedPackageName } from "./index";

describe("workspace foundation", () => {
  it("exposes the shared package placeholder", () => {
    expect(sharedPackageName).toBe("@hyperion/shared");
  });
});
