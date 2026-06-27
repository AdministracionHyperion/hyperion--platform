# Internal Dialer Readiness Security

The readiness and dry-run surfaces are blocked by design:

- no real calls;
- no provider egress;
- no direct dialer endpoint usage;
- no ElevenLabs, SIP or Twilio;
- no secrets;
- no numbers;
- no persisted dry-run call records.

`GET readiness` exposes only checklist status. `POST dry-run` accepts synthetic refs and returns
either `dry_run_accepted` or `blocked`.

Future dispatch requires completed P0 hardening, approvals, runbooks, provider configuration and
secret manager references. Those requirements are not implemented as live behavior in this loop.
