# Products / CEDCO / D02 Calls

Responsabilidad: vertical CEDCO D02 llamadas, con dominio, contratos, runtime mock, eventos mock y
evals deterministicas.

Puede depender de `core`, `agent-platform` y `voice`, pero esos modulos no deben depender de CEDCO.
No contiene datos reales, adapter ElevenLabs, SIP real, llamadas reales, inbound ni proveedor
activo.

Estado: dominio completo, persistencia/API/workers integrados en capas superiores, runtime mock y
suite de evals deterministica. El runtime real sigue fuera de alcance.
