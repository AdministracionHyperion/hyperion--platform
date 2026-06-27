# Dialer Audit Intake

La auditoria de la VM Contabo se hara fuera de este repo y en modo read-only.

## Reglas

- No modificar la VM.
- No reiniciar servicios.
- No hacer llamadas.
- No imprimir secretos.
- No copiar `.env`.
- No copiar logs crudos.
- No copiar audios.
- No copiar transcripts.
- No copiar DB dumps, certificados, backups ni archivos sensibles.

## Resultado Esperado

Un reporte sanitizado que describa arquitectura, endpoints, dependencias, flujo de llamada, riesgos
y posibles caminos de integracion con Hyperion.
