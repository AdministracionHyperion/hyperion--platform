# CEDCO R02 Final Operator Inputs

This is the consolidated list of inputs still required from the operator before the remaining real
integration work can be completed. Do not put these values in Git, chat, PR bodies or docs.

## Provider And Pilot Inputs

- Twilio Account SID and Auth Token, only when running a provider read-only or controlled pilot
  loop.
- ElevenLabs API key, only when verifying or changing provider-side agent/phone/handoff state.
- Confirmation of the approved pilot caller number and call window.
- Decision on whether persistent provider-side handoff should remain enabled.
- Approved human handoff destination, provided through a private terminal only.

## Google Calendar Inputs

- Current platform state: dashboard/API dry-run is available and produces the planned sync operation
  without external credentials or Google requests.
- OAuth/client configuration or approved service-account approach for staging.
- Calendar IDs or resource mapping for CEDCO staging.
- Sync policy decision: one-way internal-to-Google or bi-directional reconciliation.
- Rollback owner for disabling Google sync.

## Knowledge/RAG Inputs

- Sanitized CEDCO source documents for dashboard upload.
- For PDF/DOCX sources, provide extracted/sanitized text; the platform does not store binary files.
- Approval owner for RAG activation.
- Confirmation that no source contains phone numbers, IDs, medical records, financial data, raw
  transcripts or audio.

## PBX Inputs

- Decision whether PBX remains a future fallback only or should enter a staging refactor loop.
- Sanitized PBX route refs and ownership if a PBX loop is approved.

## Compliance Inputs

- Explicit approval before any broader transcript QA.
- Explicit approval before any audio access.
- Retention period and deletion owner for any future approved transcript QA artifact.
