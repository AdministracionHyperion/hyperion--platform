# CEDCO D02 Provider Webhook Durable Events

## D02-AUTO-23 Boundary

D02 staging now has durable metadata-only handling for the real provider webhook event
`call_initiation_failure`.

The platform may treat failure-event webhook persistence as staged for operational monitoring, but
must not treat this as pilot approval or successful post-call transcript readiness.

## Allowed Product Assumption

The dialer can accept signed provider failure-event callbacks for the staging agent and persist
sanitized metadata only:

- hashed event and idempotency references;
- event type and status classification;
- failure reason class;
- timestamp metadata;
- reference-present booleans;
- replay, idempotency, processing, and audit status.

## Explicitly Not Approved

- No calls.
- No customer traffic.
- No campaign or batch.
- No automatic retry.
- No provider egress.
- No live dispatch.
- No transcript QA.
- No audio access.
- No raw provider payload persistence.
- No phone numbers, DDI values, raw provider IDs, API keys, webhook secrets, or SIP credentials in
  product surfaces or versioned evidence.

## Next Gate

Any controlled call that expects webhook metadata observation requires a separate approval:

`APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
