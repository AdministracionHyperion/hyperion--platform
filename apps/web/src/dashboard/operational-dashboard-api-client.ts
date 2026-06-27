import type {
  DashboardEnvelope,
  OperationalDashboardReadModel,
} from "./operational-dashboard-types";

export interface DashboardFetchResponse {
  readonly ok: boolean;
  readonly json: () => Promise<unknown>;
}

export type DashboardFetch = (
  input: string,
  init?: Readonly<Record<string, unknown>>,
) => Promise<DashboardFetchResponse>;

export interface OperationalDashboardApiClient {
  getDashboard(input: DashboardRequestInput): Promise<OperationalDashboardReadModel>;
}

export interface DashboardRequestInput {
  readonly tenantId: string;
  readonly actorId: string;
  readonly roles: readonly string[];
  readonly correlationId: string;
}

export function createOperationalDashboardApiClient(input: {
  readonly fetchImpl: DashboardFetch;
}): OperationalDashboardApiClient {
  return {
    async getDashboard(request) {
      const path = dashboardPath(request.tenantId);
      assertInternalDashboardPath(path);
      const response = await input.fetchImpl(path, {
        method: "GET",
        headers: {
          "x-actor-id": request.actorId,
          "x-actor-roles": request.roles.join(","),
          "x-correlation-id": request.correlationId,
        },
      });
      const body = (await response.json()) as DashboardEnvelope<OperationalDashboardReadModel>;
      if (!response.ok || !body.ok) {
        throw new Error("Dashboard read failed");
      }
      return body.data;
    },
  };
}

export function dashboardPath(tenantId: string): string {
  return `/api/v1/tenants/${encodeURIComponent(tenantId)}/operations/dashboard`;
}

export function assertInternalDashboardPath(path: string): void {
  if (!path.startsWith("/api/v1/tenants/") || !path.includes("/operations/dashboard")) {
    throw new Error("Dashboard API client only accepts internal dashboard routes.");
  }
  if (/^https?:\/\//iu.test(path) || path.includes("//")) {
    throw new Error("External dashboard URL blocked.");
  }
}
