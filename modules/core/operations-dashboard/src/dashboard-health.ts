import type { DashboardStatus } from "./dashboard-status";

export interface DashboardHealth {
  readonly overallStatus: DashboardStatus;
  readonly explanation: string;
}
