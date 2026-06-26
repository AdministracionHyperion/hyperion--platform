# Integrations / Provider Adapters

Responsabilidad: adapters hacia proveedores externos.

Los adapters no deben contaminar el dominio. ElevenLabs, Twilio, PBX o gateways propios entran por
puertos internos y solo en loops posteriores.

Estado: boundary documentado, sin runtime.
