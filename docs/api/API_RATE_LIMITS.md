# API Rate Limits

API rate limits are in-memory and tenant scoped for this loop.

## Defaults

- Public health/version routes have a high limit.
- Protected read routes use `tenant_actor` scope with 120 requests per minute.
- Protected write routes use `tenant_actor` scope with 60 requests per minute.
- Voice write routes use 30 requests per minute.
- CEDCO D02 routes use 60 requests per minute.

## 429 Response

When exceeded, the API returns `rate_limit_exceeded` with HTTP 429 and keeps the request
`correlationId` in the response envelope. The response does not include PII.

## Future Work

Distributed rate limits are out of scope. Redis or BullMQ are explicitly blocked until a later
worker or infrastructure loop approves them.
