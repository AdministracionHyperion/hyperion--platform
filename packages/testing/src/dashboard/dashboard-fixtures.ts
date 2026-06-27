import { buildCedcoD02DashboardSummary } from "../../../../modules/products/cedco/d02-calls/src";

export function createDashboardFixture() {
  return buildCedcoD02DashboardSummary({
    tenantId: "cedco-test",
    correlationId: "corr-dashboard-fixture-001",
    generatedAt: new Date("2026-06-27T00:00:00.000Z"),
  });
}
