import { z } from "zod";
import { safeMetadataSchema, tenantParamsSchema } from "./common.schemas";

export const internalDialerDryRunBodySchema = z
  .object({
    externalRequestId: z.string().min(1),
    mode: z.enum(["single", "campaign"]).default("single"),
    runtimeMode: z.enum(["dry_run", "blocked", "future_live"]).default("dry_run"),
    safeContactRef: z.string().min(1),
    agentAlias: z.string().min(1),
    callerAlias: z.string().min(1),
    consentRef: z.string().min(1),
    callbackAlias: z.string().min(1).optional(),
    internalEventTopic: z.string().min(1).optional(),
    dynamicVars: safeMetadataSchema.optional().default({}),
    metadata: safeMetadataSchema.optional().default({}),
  })
  .strict();

export const internalDialerParamsSchema = tenantParamsSchema;

export type InternalDialerDryRunBody = z.infer<typeof internalDialerDryRunBodySchema>;
