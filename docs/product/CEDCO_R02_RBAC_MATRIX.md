# CEDCO R02 RBAC Matrix

| Role                   | Scope                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `super_admin_hyperion` | Full platform scope.                                                                                    |
| `cedco_admin`          | Full R02 tenant operation, including approvals and activation.                                          |
| `r02_operator`         | Calendar, appointments, agent work drafts, simulations, and handoff operations. No compliance approval. |
| `compliance_auditor`   | Read R02, inspect audit, and approve knowledge or agent versions.                                       |
| `reports_viewer`       | Read-only R02 dashboards, reports, and approved operational data.                                       |
| `integration_admin`    | Read integration status and provider readiness boundaries. No calls or provider mutation.               |
| `human_handoff_agent`  | Read and operate assigned handoff workflow.                                                             |

R02 approval routes use activation permissions so operator accounts cannot approve knowledge or
agent versions by default.
