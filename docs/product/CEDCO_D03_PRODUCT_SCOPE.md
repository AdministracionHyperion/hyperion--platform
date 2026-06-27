# CEDCO D03 Product Scope

CEDCO D03 es el futuro software de activos fijos para CEDCO.

No es D02, no es llamadas, no es voice, no usa dialer y no debe tocar runtime de llamadas.

## Objetivo Futuro

- Registro de activos.
- Inventario.
- QR/RFID futuro.
- Depreciacion NIIF.
- Movimientos.
- Mantenimiento.
- Conciliacion.
- Reportes.
- Auditoria.

## Estado Actual

- Domain contracts iniciales habilitados.
- Existe el modulo `modules/products/cedco/d03-fixed-assets`.
- Existen value objects, entidades, policies, ports, use cases, repositorio/factory de testing.

Pendiente:

- Persistencia real.
- Migraciones Prisma.
- API D03.
- Dashboard D03.
- Workers D03.
- Import/export real.
- Integracion contable.
- Carga masiva real.
- QR/RFID real.
- Reportes productivos.
- Coordinacion de DB/API con el equipo.

## Prohibido

- Datos reales del cliente.
- Excel real.
- Facturas reales.
- Fotos reales.
- Inventarios reales.
- Seriales reales.
- Responsables reales.
- Valores contables reales.
