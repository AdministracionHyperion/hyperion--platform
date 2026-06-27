# CEDCO D02 Eval Cases

The full suite covers 76 deterministic cases.

Categories:

- Readiness: consent, safe contact reference, tenant, correlation id, mock mode and unsafe metadata.
- Compliance: administrative orientation, no diagnosis, no clinical triage, safe handoff and no raw
  text.
- Scheduling: conceptual guidance, mock-only mode, integration blockers and invalid input handling.
- Eligibility: conceptual guidance, no real rights validation, integration blockers and handoff for
  uncertainty.
- Orientation: registered service/admin questions and blocked treatment/medication/clinical
  requests.
- Handoff: frustrated user, ambiguous case, clinical-risk handoff, human request and correlation
  preservation.
- Unsafe payload: blocked contact fields, raw text, audio/recording links, credentials and provider
  URL-like values.
- Clinical boundary: blocked medical conclusions, treatment, urgency prioritization and symptom
  interpretation.
- Mock runtime regression: mock flow completion, synthetic provider reference, safe events,
  post-call sanitization, audit and metrics.
- Provider event regression: valid mock event, replay blocking, signature rejection, non-mock source
  blocking, safe post-call outcome.

All cases use synthetic references such as `cedco-test`, `safe-contact-ref-001`,
`cedco-context-ref-001` and `mock_call_*`.
