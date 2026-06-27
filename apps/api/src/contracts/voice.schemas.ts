import { z } from "zod";
import { callIdParamsSchema, safeMetadataSchema, tenantParamsSchema } from "./common.schemas";

export const providerEventMetadataSchema = z
  .object({
    source: z.string().min(1).max(120).optional(),
    channel: z.string().min(1).max(120).optional(),
    safeCallSessionRef: z.string().min(1).max(120).optional(),
    eventRef: z.string().min(1).max(120).optional(),
    outcome: z.string().min(1).max(120).optional(),
    disposition: z.string().min(1).max(120).optional(),
    scenarioId: z.string().min(1).max(120).optional(),
    testCaseId: z.string().min(1).max(120).optional(),
    correlationId: z.string().min(1).max(120).optional(),
  })
  .strict()
  .default({});

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

export const mockProviderEventTypeSchema = z.enum([
  "provider.mock.call.started",
  "provider.mock.call.ringing",
  "provider.mock.call.answered",
  "provider.mock.call.intent_detected",
  "provider.mock.call.completed",
  "provider.mock.call.failed",
  "provider.mock.post_call.available",
]);

export const mockProviderEventBodySchema = z
  .object({
    eventId: z.string().min(1),
    source: z.enum(["mock", "future_elevenlabs", "future_sip", "future_pbx"]).default("mock"),
    type: mockProviderEventTypeSchema,
    providerCallRef: z.string().min(1),
    occurredAt: z.string().datetime(),
    safeSummary: z.string().min(1).optional(),
    safeIntent: z.string().min(1).optional(),
    disposition: z.string().min(1).optional(),
    handoffRecommended: z.boolean().optional(),
    metadata: providerEventMetadataSchema.optional(),
  })
  .strict();

export type CreateVoiceCallBody = z.infer<typeof createVoiceCallBodySchema>;
export type CreateVoiceCallEventBody = z.infer<typeof createVoiceCallEventBodySchema>;
export type MockProviderEventBody = z.infer<typeof mockProviderEventBodySchema>;
