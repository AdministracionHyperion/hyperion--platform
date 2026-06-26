# Prisma Schema Boundaries

El schema de Prisma es una frontera de persistencia, no una extension del dominio ni un adapter de
proveedor.

## Datos permitidos

- IDs internos y aliases seguros.
- `tenantId` para aislamiento.
- `correlationId` para trazabilidad.
- Metadata sanitizada.
- `contentRedacted` y `redactedSummary`.
- Referencias sanitizadas a proveedor, sin numeros reales ni secretos.
- `patientContextRef` y referencias internas no PII.

## Datos prohibidos como columnas

La base no define columnas para telefono real, email, documento real, transcript crudo, audio URL
cruda, recording URL, API keys, tokens, secretos o password.

Los scanners permiten que la documentacion mencione esos nombres como prohibidos, pero
`schema.prisma` y `migration.sql` no pueden declararlos como columnas.

## Provider data

Los datos especificos de proveedor quedan reducidos a referencias sanitizadas como `providerName`,
`providerEventId` y `providerCallId`. No se persiste `to_number`, host SIP, credenciales ni payload
crudo.

## CEDCO D02

El schema cubre CEDCO D02 llamadas. No hay R03, activos fijos, PBX, inbound, integraciones reales ni
runtime de llamada.

## Database URL

`DATABASE_URL` aparece solo como referencia de Prisma schema. La URL real se inyectara en runtime
futuro mediante secret manager o mecanismo equivalente. No debe existir URL real en repo.
