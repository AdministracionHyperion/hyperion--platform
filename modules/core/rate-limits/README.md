# Core Rate Limits

Dominio transversal para rate limits in-memory por tenant, actor, ruta y metodo.

Este modulo no usa Redis, no persiste contadores y no es distribuido. La implementacion es una base
segura para API/tests hasta que exista un loop dedicado a workers o infraestructura compartida.
