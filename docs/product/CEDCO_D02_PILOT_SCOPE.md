# CEDCO D02 Pilot Scope

The D02 pilot is not approved by this loop. This document defines the product limits that must be
used if a future controlled pilot gate is opened.

## Initial Pilot Limit

The first pilot window should be limited to a maximum of three controlled calls unless the release
owner approves a smaller limit. The pilot must use only approved test or explicitly authorized
numbers. Customer campaigns, batch calling and automated retries remain blocked.

## Required Controls

- One operator-owned pilot window.
- One call at a time.
- No batch or campaign execution.
- No automatic retry.
- No recording by default.
- No transcript QA unless the transcript gate is approved.
- No audio access unless the audio gate is approved.
- No public webhook until webhook auth and sanitizer gates are approved.
- Metadata-only evidence in repositories.
- Private runtime references only in `.local` or equivalent private storage.

## Rate Limits

Initial rate limits:

- maximum three calls per pilot window;
- at least five minutes between calls;
- manual operator confirmation before every call;
- stop immediately after any unexpected language, consent, routing, provider, or privacy issue.

## Required Future Approval

The future pilot gate must use a new exact approval phrase and define the window, operator, test
numbers, maximum call count, rollback owner and evidence destination before any call is attempted.
