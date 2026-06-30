# CEDCO R02 Roles And Permissions

R02 introduces scoped roles for reception, scheduling, knowledge, webhook review, PBX fallback and
human handoff operations.

Roles:

- `super_admin_hyperion`: all R02 permissions.
- `cedco_admin`: R02 operational administration, approval and integration controls.
- `r02_operator`: daily calendar, handoff and call visibility.
- `compliance_auditor`: read-only compliance, calls, webhook and report review with approval gate
  visibility.
- `reports_viewer`: report-only access.
- `integration_admin`: Google Calendar sync, webhook and PBX boundary administration.
- `human_handoff_agent`: handoff queue and calendar read access.

Permissions:

- `r02.agents.read`, `r02.agents.write`
- `r02.knowledge.read`, `r02.knowledge.write`, `r02.knowledge.approve`
- `r02.calendar.read`, `r02.calendar.write`
- `r02.google_calendar.sync`
- `r02.calls.read`, `r02.webhooks.read`
- `r02.pbx.read`, `r02.pbx.write`
- `r02.reports.read`
- `r02.compliance.approve`
- `r02.handoff.read`, `r02.handoff.write`

No role enables real calls, provider egress, transcript/audio access, Twilio credentials, Google
credentials or provider mutations.
