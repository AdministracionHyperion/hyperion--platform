import { z } from "zod";
import { callIdParamsSchema, safeMetadataSchema, tenantParamsSchema } from "./common.schemas";

export const createVoiceCallParamsSchema = tenantParamsSchema;

export const createVoiceCallBodySchema = z
  .object({
    callId: z.string().min(1),
    direction: z.enum(["outbound", "inbound"]),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const createVoiceCallEventParamsSchema = callIdParamsSchema;

export const createVoiceCallEventBodySchema = z
  .object({
    type: z.string().min(1),
    status: z.string().optional(),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const getVoiceCallParamsSchema = callIdParamsSchema;

export type CreateVoiceCallBody = z.infer<typeof createVoiceCallBodySchema>;
export type CreateVoiceCallEventBody = z.infer<typeof createVoiceCallEventBodySchema>;
