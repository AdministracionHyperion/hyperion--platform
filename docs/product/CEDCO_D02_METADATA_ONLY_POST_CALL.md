# CEDCO D02 Metadata-Only Post-Call

The platform may consume only sanitized post-call metadata for D02 until a future compliance gate
changes the policy.

Allowed metadata:

- event type;
- hashed or redacted event reference;
- status;
- timestamps;
- duration;
- end reason;
- provider status class;
- call completed flag;
- answered flag;
- sanitized error class.

Disallowed by default:

- transcript text;
- audio URL, audio bytes or recording references;
- summary;
- analysis;
- raw provider payload;
- phone numbers;
- DDI values;
- provider IDs;
- API keys;
- SIP credentials;
- real `.env` values.

Any transcript QA or audio handling must use future explicit approval gates and private storage.
Repository artifacts remain sanitized metadata only.
