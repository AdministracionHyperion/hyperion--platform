# Core / Audit

Responsabilidad: trazabilidad y audit log obligatorio.

Todo evento relevante debe registrar `tenantId`, `correlationId`, actor, decision y timestamp
sanitizado. No debe almacenar PII innecesaria.

Estado: boundary documentado, sin runtime.
