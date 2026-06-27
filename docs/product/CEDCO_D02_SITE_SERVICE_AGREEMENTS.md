# CEDCO D02 Sites, Services And Agreements

## Sedes iniciales

Las sedes iniciales permitidas por dominio son:

- `bucaramanga`.
- `piedecuesta`.
- `barrancabermeja`.

## Servicios

Los servicios deben registrarse por tenant y asociarse a sedes permitidas. El dominio no inventa
servicios. Si un servicio no esta registrado, la respuesta correcta es fallback seguro o handoff.

## Convenios/EPS

Los convenios deben registrarse por tenant y asociarse a servicios permitidos. El dominio no afirma
cobertura real si el convenio es desconocido o si falta integracion.

## No invencion

CEDCO D02 aplica politica de conocimiento:

- No inventar sedes.
- No inventar servicios.
- No inventar convenios.
- No completar datos faltantes con suposiciones.

## KnowledgeBaseVersion activa

Para FAQ, servicios, convenios, sedes y horarios se requiere una `KnowledgeBaseVersion` activa. Si
falta, readiness bloquea el flujo operativo.
