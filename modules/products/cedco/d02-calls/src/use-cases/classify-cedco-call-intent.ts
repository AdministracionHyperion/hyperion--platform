import type { CedcoCallIntent } from "../cedco-call-intent";

export interface ClassifyCedcoCallIntentInput {
  readonly textRedacted: string;
  readonly hintIntent?: CedcoCallIntent;
}

export function classifyCedcoCallIntent(input: ClassifyCedcoCallIntentInput): CedcoCallIntent {
  if (input.hintIntent) {
    return input.hintIntent;
  }

  const text = input.textRedacted.toLowerCase();

  if (/\b(no llamar|opt[- ]?out|retirar|cancelar consentimiento)\b/u.test(text)) {
    return "opt_out";
  }
  if (/\b(humano|asesor|persona|operador)\b/u.test(text)) {
    return "solicitar_humano";
  }
  if (/\b(urgencia|emergencia|grave|dolor fuerte)\b/u.test(text)) {
    return "urgencia";
  }
  if (/\b(reagendar|cambiar cita)\b/u.test(text)) {
    return "reagendar";
  }
  if (/\b(cancelar cita|cancelacion)\b/u.test(text)) {
    return "cancelar";
  }
  if (/\b(agendar|cita|programar)\b/u.test(text)) {
    return "agendar";
  }
  if (/\b(sede|ubicacion|direcci[oó]n|bucaramanga|piedecuesta|barrancabermeja)\b/u.test(text)) {
    return "consultar_sede";
  }
  if (/\b(horario|hora|atienden)\b/u.test(text)) {
    return "consultar_horario";
  }
  if (/\b(servicio|examen|procedimiento)\b/u.test(text)) {
    return "consultar_servicio";
  }
  if (/\b(convenio|eps|asegurador)\b/u.test(text)) {
    return "consultar_convenio";
  }
  if (/\b(informaci[oó]n|orientaci[oó]n)\b/u.test(text)) {
    return "orientacion_general";
  }

  return "desconocida";
}
