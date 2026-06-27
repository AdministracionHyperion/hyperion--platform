import { describe, expect, it } from "vitest";
import { createDashboardFixture } from "../../../../../packages/testing/src";
import { renderOperationalDashboardPage } from "../operational-dashboard-page";

describe("operational dashboard page", () => {
  it("renders dashboard shell", () => {
    const html = renderOperationalDashboardPage(createDashboardFixture());
    expect(html).toContain("CEDCO D02 Operations");
    expect(html).toContain("dashboard-shell");
  });

  it("does not render sensitive data", () => {
    const html = renderOperationalDashboardPage(createDashboardFixture());
    expect(html).not.toMatch(/phoneNumber|rawTranscript|audioUrl|token|secret/iu);
  });
});
