# CEDCO D02 Domain Security Baseline

## Tenant isolation

Todas las entidades CEDCO D02 incluyen `tenantId`. Los use cases operan desde `OperationContext` y
rechazan desalineaciones de tenant cuando aplica.

## RBAC

Configuracion y registro de catalogos requieren permisos de tenant o agent management. Roles de solo
lectura no pueden modificar CEDCO D02.

## Audit log

Los use cases principales aceptan `AuditLogPort` opcional y registran eventos sanitizados con
`correlationId`.

## Metadata sanitization

Toda metadata y dimensions pasan por `SafeMetadata`. Claves sensibles se redactan o bloquean segun
la politica de dominio.

## No phone real

CEDCO D02 usa alias y referencias internas. No persiste telefonos reales ni `to_number`.

## No historia clinica real

`CedcoPatientContextRef` es una referencia segura. No contiene documento, email, telefono, historia
clinica ni dato real de paciente.

## No transcript ni audio crudo

El dominio bloquea `rawTranscript`, `transcript`, `audioUrl` y `recordingUrl`.

## No diagnostico ni triage clinico

La politica de compliance bloquea diagnostico, triage, recomendaciones medicas, decisiones clinicas,
lectura de resultados e historia clinica.

## Opt-out y consentimiento

`CedcoConsentRef` es una referencia segura. Opt-out genera cierre/handoff y debe respetarse antes de
cualquier llamada futura.

## Habeas data

El dominio minimiza datos, usa referencias seguras, mantiene auditabilidad y no guarda PII/PHI real.
Las excepciones futuras requieren consentimiento, aprobacion humana, retencion definida y controles
de seguridad.
