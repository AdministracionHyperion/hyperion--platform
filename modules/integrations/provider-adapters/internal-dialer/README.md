# Internal Dialer Adapter

Blocked-by-default contract for a future hardened internal dialer boundary.

This module does not call the current dialer, ElevenLabs, SIP, Twilio or any provider. It only
validates requests, supports safe dry-run contracts and returns blocked dispatch results until P0
hardening is complete and future policy gates explicitly allow real calls/provider egress.

Current production/demo dialer endpoints such as `POST /api/demo/call` and campaign start endpoints
are intentionally not used by Hyperion.
