# Auth Real Roadmap

## Estado Actual

`header-dev` sigue disponible para tests y desarrollo. Produccion requiere `jwt-required` y una
referencia de proveedor, pero las rutas protegidas quedan bloqueadas hasta implementar validacion
real.

## Proximo Trabajo

- Definir proveedor de identidad.
- Implementar verificacion JWT/JWKS.
- Mapear claims a `actorId`, roles y permisos.
- Agregar tests de tokens validos, expirados, tenant mismatch y roles insuficientes.
- Agregar rotacion de keys y runbook.

## Fuera De Alcance Actual

- Secrets reales.
- Cookies/sesiones.
- OAuth completo.
- Deploy productivo.
