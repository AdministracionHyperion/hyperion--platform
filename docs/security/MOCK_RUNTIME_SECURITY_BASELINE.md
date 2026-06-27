# Mock Runtime Security Baseline

El runtime mock esta cerrado para produccion y llamadas reales.

## Controles

- `runtimeMode` siempre es `mock`.
- No hay provider egress.
- No hay llamadas reales.
- No hay numeros reales.
- No hay raw transcript.
- No hay raw recording.
- No hay audio URL cruda.
- No hay secretos.
- Policy gates bloquean flags peligrosos.
- Runtime blockers rechazan campos prohibidos antes de la ruta.

## Datos persistidos

Solo se persisten referencias sinteticas, eventos mock, resumen redactado, audit events y metricas
conceptuales.

## Limitaciones

No valida telefonia real, SIP, latencia real, audio, STT/TTS ni comportamiento de proveedor.
