import { z } from "zod";

export const safeMetadataSchema = z.record(z.string(), z.unknown()).default({});

export const tenantParamsSchema = z.object({
  tenantId: z.string().min(1),
});

export const featureFlagParamsSchema = tenantParamsSchema.extend({
  flagKey: z.string().min(1),
});

export const callIdParamsSchema = tenantParamsSchema.extend({
  callId: z.string().min(1),
});

export const agentIdParamsSchema = tenantParamsSchema.extend({
  agentId: z.string().min(1),
});

export type SafeMetadataDto = z.infer<typeof safeMetadataSchema>;
