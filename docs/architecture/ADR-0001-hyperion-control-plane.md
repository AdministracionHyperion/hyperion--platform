# ADR-0001: Hyperion como control plane

## Estado

Aceptado para CEDCO R02 / D02 llamadas.

## Contexto

Hyperion es el nucleo multi-tenant reutilizable para agentes de IA de voz y conversacionales. El
primer vertical priorizado es CEDCO R02 / D02 llamadas.

CEDCO D02 requiere agente de voz IA, tenant dedicado, intencion via LLM, respuestas contextuales,
contexto conversacional, transferencia a humano por reglas, registro de llamadas/eventos,
gobernanza, observabilidad, versionado, dashboard operativo futuro, roadmap de integracion,
seguridad y habeas data.

## Decision

Hyperion es el control plane. Hyperion controla:

- Tenants y aislamiento multi-tenant.
- Configuracion de agentes, versiones activas y lifecycle.
- Permisos, RBAC y aprobaciones humanas.
- Auditoria, trazabilidad y governance.
- Metricas operativas, feedback y evaluaciones.
- Politicas de consentimiento, opt-out, horarios, rate limit y proposito.
- Estado de llamadas y referencias sanitizadas de proveedor.

Hyperion no transporta audio en fase 1.

Hyperion no es PBX en fase 1.

CEDCO D02 es el primer vertical de plataforma.

## Consecuencias

- La logica de dominio no debe acoplarse a ElevenLabs, Twilio, PBX propio ni ningun proveedor de
  telefonia.
- Los proveedores de voz y telefonia se integran mediante puertos internos y adapters.
- El dashboard, las integraciones y la observabilidad se construyen sobre eventos y estados
  sanitizados.
- Las llamadas reales quedan bloqueadas hasta tener flags, runbooks, aprobacion humana y controles
  de seguridad.

## Fuera de alcance

- CEDCO R03 activos fijos.
- Hospital R01, REDMIA R04, Coopfuturo y otros verticales R01-R11.
- Produccion, deploy, datos reales, secretos, numeros reales y llamadas reales.
