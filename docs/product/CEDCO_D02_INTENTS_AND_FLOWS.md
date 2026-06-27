# CEDCO D02 Intents And Flows

## Intenciones

`CedcoCallIntent` incluye:

- `consultar_sede`.
- `consultar_horario`.
- `consultar_servicio`.
- `consultar_convenio`.
- `agendar`.
- `reagendar`.
- `cancelar`.
- `orientacion_general`.
- `solicitar_humano`.
- `opt_out`.
- `urgencia`.
- `desconocida`.

La clasificacion actual es deterministica para pruebas. No llama LLM real.

## Objetivos

`CedcoCallObjective` incluye:

- `faq`.
- `scheduling`.
- `eligibility`.
- `reminder`.
- `orientation`.
- `handoff`.
- `unknown`.

## Flujos permitidos

- Orientar sobre sedes registradas.
- Orientar sobre servicios registrados.
- Orientar sobre convenios registrados.
- Explicar que una agenda real requiere integracion futura.
- Crear solicitudes mock cuando `schedulingMode=mock`.
- Crear validaciones mock cuando `eligibilityMode=mock`.
- Recomendar handoff ante urgencia, humano, bajo confidence o riesgo de politica.

## Flujos bloqueados

- Diagnostico medico.
- Triage clinico.
- Lectura o interpretacion clinica.
- Confirmar citas reales sin integracion real.
- Confirmar derechos reales sin integracion real.
- Inventar sedes, servicios o convenios.
- Usar telefonos reales, historia clinica real, transcript crudo o audio crudo.

## Orientacion, mock e integracion futura

Orientacion significa explicar informacion registrada y limitaciones.

Mock significa respuesta sintetica controlada para pruebas de dominio.

Integracion futura significa que se requiere adapter real en otra capa. Este loop solo devuelve
`integration_required`; no ejecuta agenda real ni elegibilidad real.
