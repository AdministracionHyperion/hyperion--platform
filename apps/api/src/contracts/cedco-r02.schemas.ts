import { z } from "zod";
import { tenantParamsSchema } from "./common.schemas";

export const cedcoR02ParamsSchema = tenantParamsSchema;

export const cedcoR02IdParamsSchema = tenantParamsSchema.extend({
  id: z.string().min(1).max(120),
});

const r02MetadataSchema = z
  .object({
    source: z.string().min(1).max(120).optional(),
    purpose: z.string().min(1).max(120).optional(),
    notes: z.string().min(1).max(240).optional(),
    safeContactRef: z.string().min(1).max(120).optional(),
    patientContextRef: z.string().min(1).max(120).optional(),
    serviceRef: z.string().min(1).max(120).optional(),
    siteRef: z.string().min(1).max(120).optional(),
    resourceRef: z.string().min(1).max(120).optional(),
    sourceRef: z.string().min(1).max(120).optional(),
  })
  .strict()
  .default({});

export const availabilityQuerySchema = z
  .object({
    siteId: z.string().min(1).max(120).optional(),
    serviceTypeId: z.string().min(1).max(120).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .strict();

export const createAvailabilityBodySchema = z
  .object({
    slotId: z.string().min(1).max(120),
    resourceId: z.string().min(1).max(120),
    siteId: z.string().min(1).max(120),
    serviceTypeId: z.string().min(1).max(120),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    capacity: z.number().int().min(1).max(20).default(1),
    metadata: r02MetadataSchema.optional(),
  })
  .strict();

export const createAppointmentBodySchema = z
  .object({
    appointmentId: z.string().min(1).max(120),
    slotId: z.string().min(1).max(120),
    patientRef: z.string().min(1).max(120),
    metadata: r02MetadataSchema.optional(),
  })
  .strict();

export const rescheduleAppointmentBodySchema = z
  .object({
    newSlotId: z.string().min(1).max(120),
  })
  .strict();

export const createKnowledgeBaseBodySchema = z
  .object({
    knowledgeBaseId: z.string().min(1).max(120),
    name: z.string().min(1).max(160),
  })
  .strict();

export const uploadKnowledgeDocumentBodySchema = z
  .object({
    documentId: z.string().min(1).max(120),
    sourceName: z.string().min(1).max(160),
    contentText: z.string().min(1).max(20000),
    metadata: r02MetadataSchema.optional(),
  })
  .strict();

export const searchKnowledgeBodySchema = z
  .object({
    queryText: z.string().min(1).max(400),
    limit: z.number().int().min(1).max(10).default(5),
  })
  .strict();

export const createAgentBodyR02Schema = z
  .object({
    seedDemo: z.boolean().default(true),
  })
  .strict();

export const createAgentVersionBodyR02Schema = z
  .object({
    versionId: z.string().min(1).max(120),
    greeting: z.string().min(1).max(400),
    prompt: z.string().min(1).max(4000),
    allowedTools: z
      .array(
        z.enum([
          "answer_from_knowledge",
          "check_availability",
          "create_appointment",
          "transfer_to_human",
          "create_followup_task",
        ]),
      )
      .optional(),
  })
  .strict();

export const simulateAgentFlowBodySchema = z
  .object({
    simulationId: z.string().min(1).max(120),
    intent: z.enum(["schedule", "knowledge", "handoff"]),
    queryText: z.string().min(1).max(400),
    slotId: z.string().min(1).max(120).optional(),
    appointmentId: z.string().min(1).max(120).optional(),
    patientRef: z.string().min(1).max(120).optional(),
  })
  .strict();

export const upsertHandoffTargetBodySchema = z
  .object({
    targetId: z.string().min(1).max(120),
    targetType: z.enum(["human", "pbx", "twilio_fallback"]),
    displayName: z.string().min(1).max(160),
    routeRef: z.string().min(1).max(160),
    status: z.enum(["active", "disabled"]).default("active"),
    metadata: r02MetadataSchema.optional(),
  })
  .strict();

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateAvailabilityBody = z.infer<typeof createAvailabilityBodySchema>;
export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;
export type RescheduleAppointmentBody = z.infer<typeof rescheduleAppointmentBodySchema>;
export type CreateKnowledgeBaseBody = z.infer<typeof createKnowledgeBaseBodySchema>;
export type UploadKnowledgeDocumentBody = z.infer<typeof uploadKnowledgeDocumentBodySchema>;
export type SearchKnowledgeBody = z.infer<typeof searchKnowledgeBodySchema>;
export type CreateAgentBodyR02 = z.infer<typeof createAgentBodyR02Schema>;
export type CreateAgentVersionBodyR02 = z.infer<typeof createAgentVersionBodyR02Schema>;
export type SimulateAgentFlowBody = z.infer<typeof simulateAgentFlowBodySchema>;
export type UpsertHandoffTargetBody = z.infer<typeof upsertHandoffTargetBodySchema>;
