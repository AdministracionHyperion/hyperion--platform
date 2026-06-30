# CEDCO R02 Provider Reuse Decision

Read-only reconciliation result: `INCONCLUSIVE_NEEDS_OPERATOR_DECISION`.

| Item                                         | Status      |
| -------------------------------------------- | ----------- |
| Twilio account auth status                   | auth_failed |
| Twilio incoming numbers status               | auth_failed |
| Same number seen in Twilio and ElevenLabs    | no          |
| Legacy number risk                           | no          |
| Bound agent appears test agent               | unknown     |
| Bound agent appears safe to convert to CEDCO | unknown     |

The decision is based on sanitized counts, booleans, redacted hashes, and classification only. Raw
Twilio numbers, Twilio SIDs, ElevenLabs IDs, and credentials are not versioned.
