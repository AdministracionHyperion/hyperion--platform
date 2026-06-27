# Dialer Audit Start Here

La auditoria del dialer se ejecuta en otra terminal y en la VM correspondiente. No se ejecuta dentro
de este repo.

## Leer Primero

- `docs/dialer/DIALER_AUDIT_INTAKE.md`.
- `docs/dialer/DIALER_SANITIZATION_REQUIREMENTS.md`.
- `docs/dialer/DIALER_VM_READONLY_AUDIT_PROMPT.md`.
- `docs/dialer/DIALER_REPO_EXPORT_POLICY.md`.

## Reglas

- No pasar secretos.
- No subir snapshot crudo.
- No copiar `.env`.
- No copiar logs crudos.
- No copiar audios/transcripts.
- No hacer llamadas.
- No reiniciar servicios.

## Output

Reporte sanitizado `DIALER_READONLY_AUDIT_REPORT.md` producido fuera de este repo.
