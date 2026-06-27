import type { OperationalDashboardReadModel } from "./dashboard-read-model";

export interface DashboardReadModelPort {
  getDashboard(input: {
    readonly tenantId: string;
    readonly correlationId: string;
  }): Promise<OperationalDashboardReadModel>;
}
