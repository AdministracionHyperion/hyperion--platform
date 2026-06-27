import { z } from "zod";
import { agentIdParamsSchema, safeMetadataSchema, tenantParamsSchema } from "./common.schemas";

export const createAgentParamsSchema = tenantParamsSchema;

export const createAgentBodySchema = z
  .object({
    agentId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    defaultLocale: z.string().min(2),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export const createAgentVersionParamsSchema = agentIdParamsSchema;

export const createAgentVersionBodySchema = z
  .object({
    promptVersionId: z.string().min(1).optional(),
    flowVersionId: z.string().min(1).optional(),
    knowledgeBaseVersionId: z.string().min(1).optional(),
    capabilities: z.array(z.string().min(1)).default([]),
    metadata: safeMetadataSchema.optional(),
  })
  .strict();

export type CreateAgentBody = z.infer<typeof createAgentBodySchema>;
export type CreateAgentVersionBody = z.infer<typeof createAgentVersionBodySchema>;
