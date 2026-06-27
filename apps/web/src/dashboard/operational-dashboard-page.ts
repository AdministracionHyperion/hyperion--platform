import type { OperationalDashboardReadModel } from "./operational-dashboard-types";
import { renderDashboardShell } from "./components/dashboard-shell";

export function renderOperationalDashboardPage(model: OperationalDashboardReadModel): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hyperion Operations</title>
    <link rel="stylesheet" href="./styles/operational-dashboard.css" />
  </head>
  <body>
    ${renderDashboardShell(model)}
  </body>
</html>`;
}
