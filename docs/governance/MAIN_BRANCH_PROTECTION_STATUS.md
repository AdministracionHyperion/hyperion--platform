# Main Branch Protection Status

Fecha: 2026-06-27.

## Estado Detectado

`main` estaba sin proteccion activa al iniciar este hardening. Se aplico branch protection mediante
GitHub CLI/API con permisos de administrador.

## Reglas Aplicadas

- Pull request requerido antes de mergear.
- Status checks requeridos:
  - `verify`.
  - `db-integration`.
  - `api-integration`.
- Branch debe estar actualizado antes del merge.
- Una aprobacion requerida.
- Conversaciones resueltas antes del merge.
- Admins incluidos en la regla.
- Force push deshabilitado.
- Deletion deshabilitado.

## Accion Manual

No queda accion manual conocida para la regla minima. Si GitHub cambia nombres de checks o se
agregan jobs requeridos, un administrador debe actualizar la proteccion desde Settings -> Branches.

## Limites

Esta proteccion no habilita produccion, deploy, providers reales, llamadas reales ni secretos.
