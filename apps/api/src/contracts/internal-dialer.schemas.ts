import { z } from "zod";
import { safeMetadataSchema, tenantParamsSchema } from "./common.schemas";

export const internalDialerDryRunBodySchema = z
  .object({
    idempotency_key: z.string().min(1).optional(),
    external_request_id: z.string().min(1).optional(),
    mode: z.enum(["single", "campaign"]).default("single"),
    runtimeMode: z.enum(["dry_run", "blocked", "future_live"]).default("dry_run"),
    safe_contact_ref: z.string().min(1),
    agent_alias: z.string().min(1).default("cedco-agent-alias"),
    caller_alias: z.string().min(1).default("cedco-caller-alias"),
    consent: z.object({ granted: z.boolean() }).strict(),
    consent_ref: z.string().min(1),
    callback_alias: z.string().min(1).optional(),
    internal_event_topic: z.string().min(1).optional(),
    dynamic_vars: safeMetadataSchema.optional().default({}),
    metadata: safeMetadataSchema.optional().default({}),
  })
  .strict();

export const internalDialerParamsSchema = tenantParamsSchema;

export type InternalDialerDryRunBody = z.infer<typeof internalDialerDryRunBodySchema>;
