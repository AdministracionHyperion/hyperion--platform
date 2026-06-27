import { describe, expect, it } from "vitest";
import { createDashboardFixture } from "../../../../../packages/testing/src";
import {
  assertInternalDashboardPath,
  createOperationalDashboardApiClient,
  dashboardPath,
} from "../operational-dashboard-api-client";
import { renderDashboardShell } from "../components/dashboard-shell";

describe("operational dashboard web security", () => {
  it("dashboard does not render unsafe fields", () => {
    const html = renderDashboardShell(createDashboardFixture());
    expect(html).not.toMatch(/phoneNumber|rawTranscript|audioUrl|token|secret/iu);
  });

  it("API client rejects external URL", () => {
    expect(() => assertInternalDashboardPath("https://example.invalid/api")).toThrow();
  });

  it("API client uses relative internal route", () => {
    expect(dashboardPath("cedco-test")).toBe("/api/v1/tenants/cedco-test/operations/dashboard");
  });

  it("API client can fetch dashboard with injected fetch", async () => {
    const client = createOperationalDashboardApiClient({
      fetchImpl: async (path) => ({
        ok: true,
        json: async () => ({
          ok: true,
          data: createDashboardFixture(),
          meta: {
            correlationId: "corr-dashboard-client-001",
            timestamp: "2026-06-27T00:00:00.000Z",
          },
          path,
        }),
      }),
    });
    const dashboard = await client.getDashboard({
      tenantId: "cedco-test",
      actorId: "actor-test",
      roles: ["tenant-admin"],
      correlationId: "corr-dashboard-client-001",
    });
    expect(dashboard.tenantId).toBe("cedco-test");
  });

  it("CSS path is local", () => {
    expect(renderDashboardShell(createDashboardFixture())).not.toContain("http");
  });
});
