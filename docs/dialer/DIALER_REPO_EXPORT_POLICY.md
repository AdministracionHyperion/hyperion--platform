# Dialer Repo Export Policy

Si se necesita snapshot del dialer, debe ser sanitizado y preferiblemente en un repo privado
separado.

## Repos Sugeridos

- `hyperion-dialer-sanitized`.
- `nextvoice-dialer-audit`.

## Reglas

- No subir snapshot crudo.
- No usar credenciales GitHub en la VM si se puede evitar.
- Exportar a PC y hacer push desde PC.
- Ejecutar secret scan antes de push.
- Revisar que no haya `.env`, logs crudos, audios, transcripts, dumps, certificados ni backups.
- Sanitizar `docker-compose`, configs y ejemplos.

## Flujo

1. Generar reporte read-only en VM.
2. Sanitizar cualquier archivo necesario.
3. Transferir solo artefactos sanitizados a PC.
4. Correr scans locales.
5. Crear repo privado separado.
6. Push desde PC.
