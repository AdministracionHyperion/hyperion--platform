# CEDCO D03 Data Policy

The D03 lane remains synthetic-data only.

Blocked until an explicit future import/export control loop:

- Real asset spreadsheets or bulk files.
- Real billing documents or document references.
- Real photos or image files.
- Real custodians, emails, phone-like values, or personal identifiers.
- Real supplier/vendor references.
- External URLs.
- Unsafe metadata keys such as token, apiKey, password, raw payload, audio, or transcript fields.

Current policy behavior:

- Manual-entry synthetic records are allowed.
- File upload and bulk export readiness return blocked.
- Metadata is rejected when unsafe D03 terms or sensitive values are detected.
- Depreciation remains explicitly pending for a future reviewed loop.

No production data, external systems, or provider integrations are used.
