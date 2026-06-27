import type { DashboardStatus } from "./dashboard-status";

export interface DashboardCard {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly status: DashboardStatus;
  readonly helperText: string;
}
