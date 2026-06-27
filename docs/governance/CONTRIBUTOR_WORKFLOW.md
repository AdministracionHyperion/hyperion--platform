# Contributor Workflow

## Setup

```bash
git clone https://github.com/AdministracionHyperion/hyperion--platform.git
cd hyperion--platform
git checkout main
git pull --ff-only origin main
pnpm install
pnpm check
```

## Ramas

Crear trabajo nuevo desde `main` actualizado:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feature/mi-loop
```

Convenciones recomendadas:

- `feature/cedco-d03-fixed-assets-domain-expansion`.
- `feature/cedco-d03-fixed-assets-api`.
- `feature/cedco-d03-fixed-assets-dashboard`.
- `hardening/<tema>`.

## Checks Locales

Antes de entregar:

```bash
pnpm check
pnpm run repo:guard
pnpm db:schema:check
pnpm test
```

Si el loop toca API integration, usar PostgreSQL efimero y correr `pnpm test:integration:api`.

## Reglas

- No tocar `_private/`.
- No commitear docs Word, zips, PDFs, dumps, backups, audios, transcripts ni logs crudos.
- No usar providers reales.
- No crear deploy.
- No crear llamadas reales.
- No abrir rutas reales de webhook o dispatch.
- No tocar D02 si el trabajo es D03.
- No tocar D03 si el trabajo es D02/dialer.
- No tocar Prisma schema sin coordinacion explicita.

## Reporte Final

Cada loop debe reportar ruta, remote, rama, cambios hechos, validaciones ejecutadas, restricciones
respetadas, commit, push si aplica y riesgos residuales.
