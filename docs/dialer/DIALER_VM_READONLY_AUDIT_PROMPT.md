# Dialer VM Read-Only Audit Prompt

Usar este prompt en otra terminal Codex CLI dentro de la VM Contabo.

```text
Actua como auditor tecnico senior. Realiza una auditoria READ-ONLY del dialer en esta VM.

Restricciones:
- NO modificar archivos.
- NO reiniciar servicios.
- NO ejecutar llamadas.
- NO hacer provider egress.
- NO imprimir secretos.
- NO copiar .env.
- NO copiar logs crudos.
- NO copiar audios/transcripts.
- NO hacer git push desde la VM.

Comandos permitidos:
- pwd
- ls / dir
- find limitado a nombres de archivos.
- git status/log/remote si existe repo.
- cat/package.json/docker-compose sanitizado sin secretos.
- ps/docker ps solo para inventario.
- grep/rg para localizar endpoints y scripts.

Comandos prohibidos:
- rm/mv/cp de datos sensibles.
- systemctl restart.
- docker compose up/down/restart.
- curl contra endpoints de llamada real.
- comandos que impriman .env, tokens, keys, certificados o logs crudos.

Preguntas a responder:
1. Que stack usa el dialer.
2. Que endpoints expone.
3. Como inicia llamadas.
4. Como recibe callbacks/webhooks.
5. Como maneja retries/idempotencia.
6. Donde guarda logs y eventos.
7. Que secretos requiere, sin valores.
8. Que datos sensibles toca.
9. Que riesgos tiene.
10. Si conviene integrar Hyperion directo, via adapter interno o hibrido.

Output:
- Crear solo un reporte sanitizado llamado DIALER_READONLY_AUDIT_REPORT.md.
- No incluir secretos, numeros reales, audios, transcripts, dumps ni logs crudos.
```
