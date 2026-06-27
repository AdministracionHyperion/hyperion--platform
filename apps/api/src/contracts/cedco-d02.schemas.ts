import { z } from "zod";
import { safeMetadataSchema, tenantParamsSchema } from "./common.schemas";

export const cedcoD02ParamsSchema = tenantParamsSchema;

export const cedcoSchedulingModeSchema = z.enum(["disabled", "mock", "integration"]);
export const cedcoEligibilityModeSchema = z.enum(["disabled", "mock", "integration"]);
export const cedcoIntentSchema = z.enum([
  "consultar_sede",
  "consultar_horario",
  "consultar_servicio",
  "consultar_convenio",
  "agendar",
  "reagendar",
  "cancelar",
  "orientacion_general",
  "solicitar_humano",
  "opt_out",
  "urgencia",
  "desconocida",
]);
export const cedcoObjectiveSchema = z.enum([
  "faq",
  "scheduling",
  "eligibility",
  "reminder",
  "orientation",
  "handoff",
  "unknown",
]);

export const cedcoConfigurationSchema = z
  .object({
    defaultLocale: z.literal("es-CO").default("es-CO"),
    activeAgentVersionId: z.string().min(1).optional(),
    activePromptVersionId: z.string().min(1).optional(),
    activeFlowVersionId: z.string().min(1).optional(),
    activeKnowledgeBaseVersionId: z.string().min(1).optional(),
    allowedSiteIds: z.array(z.string().min(1)).default([]),
    allowedServiceIds: z.array(z.string().min(1)).default([]),
    handoffEnabled: z.boolean().default(true),
    schedulingMode: cedcoSchedulingModeSchema.default("mock"),
    eligibilityMode: cedcoEligibilityModeSchema.default("mock"),
    realCallsEnabled: z.boolean().default(false),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const classifyCedcoIntentBodySchema = z
  .object({
    text: z.string().min(1),
    hint: cedcoIntentSchema.optional(),
  })
  .strict();

export const evaluateCedcoReadinessBodySchema = z
  .object({
    configuration: cedcoConfigurationSchema,
    objective: cedcoObjectiveSchema.optional(),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const evaluateCedcoComplianceBodySchema = z
  .object({
    text: z.string().min(1),
    intent: cedcoIntentSchema.optional(),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const evaluateCedcoHandoffBodySchema = z
  .object({
    intent: cedcoIntentSchema,
    confidence: z.number().min(0).max(1).optional(),
    reason: z.string().optional(),
  })
  .strict();

export const createCedcoSchedulingRequestBodySchema = z
  .object({
    patientContextRef: z.string().min(1),
    serviceId: z.string().min(1),
    siteId: z.string().min(1).optional(),
    mode: z.enum(["mock", "integration_required"]),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const createCedcoEligibilityCheckBodySchema = z
  .object({
    patientContextRef: z.string().min(1),
    agreementId: z.string().min(1).optional(),
    serviceId: z.string().min(1).optional(),
    mode: z.enum(["mock", "integration_required"]),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const runCedcoD02MockCallFlowBodySchema = z
  .object({
    cedcoSiteId: z.string().min(1),
    serviceId: z.string().min(1),
    agreementId: z.string().min(1).optional(),
    safeContactRef: z.string().min(1),
    patientContextRef: z.string().min(1),
    consentRef: z.string().min(1),
    callPurpose: z.enum([
      "orientation",
      "scheduling_support",
      "eligibility_support",
      "reminder",
      "follow_up",
      "human_handoff",
    ]),
    objective: cedcoObjectiveSchema,
    scriptId: z.string().min(1).optional(),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export type CedcoConfigurationBody = z.infer<typeof cedcoConfigurationSchema>;
export type ClassifyCedcoIntentBody = z.infer<typeof classifyCedcoIntentBodySchema>;
export type EvaluateCedcoReadinessBody = z.infer<typeof evaluateCedcoReadinessBodySchema>;
export type EvaluateCedcoComplianceBody = z.infer<typeof evaluateCedcoComplianceBodySchema>;
export type EvaluateCedcoHandoffBody = z.infer<typeof evaluateCedcoHandoffBodySchema>;
export type CreateCedcoSchedulingRequestBody = z.infer<
  typeof createCedcoSchedulingRequestBodySchema
>;
export type CreateCedcoEligibilityCheckBody = z.infer<typeof createCedcoEligibilityCheckBodySchema>;
export type RunCedcoD02MockCallFlowBody = z.infer<typeof runCedcoD02MockCallFlowBodySchema>;
