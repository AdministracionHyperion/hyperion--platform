export const webAppBoundary = {
  name: "@hyperion/web",
  status: "operational-dashboard-skeleton",
  runtime: "static-read-only",
} as const;

export * from "./dashboard/operational-dashboard-api-client";
export * from "./dashboard/operational-dashboard-page";
export * from "./dashboard/operational-dashboard-types";
export * from "./dashboard/r02-operational-page";
export * from "./dashboard/components/dashboard-shell";
