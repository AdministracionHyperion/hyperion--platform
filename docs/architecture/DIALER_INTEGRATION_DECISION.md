# Dialer Integration Decision

## Decision

Hyperion adopta la ruta C) Hibrida:

```text
Hyperion
  -> InternalDialerAdapter
    -> futuro endpoint interno hardened del Dialer
      -> ElevenLabs SIP trunk
        -> DID/SIP provider
```

`InternalDialerAdapter` es la frontera obligatoria. Hyperion no debe llamar directamente al Dialer
actual, ElevenLabs, SIP ni Twilio.

## No Usar Todavia

- `POST /api/demo/call`.
- `POST /api/campaigns/{campaign_id}/start`.
- ElevenLabs directo.
- SIP directo.
- Twilio directo.

## Motivos

- El Dialer no tiene dry-run real.
- La llamada unitaria no tiene idempotency key persistida.
- `outcome_data` puede persistir transcript, audio URL, audio base64 o payload crudo.
- La firma de webhook puede ser condicional si falta secret.
- Auth puede caer a anonymous si falta `AUTH_JWT_SECRET`.
- Rate limits y dispatcher son in-memory.
- Retry/DLQ existen pero no parecen activos en el flujo principal.
- Contactos `pending` podrian redialear si no se marcan attempted/processed de forma atomica.

## Futuro

Single-call controlado puede ir por driver interno hardened o driver ElevenLabs directo detras del
mismo puerto. Campanas y rotacion DDI pueden ir por un `DialerCurrentAdapter` solo despues del P0
hardening.

Hasta entonces, Hyperion solo tiene contrato bloqueado y dry-run seguro.
