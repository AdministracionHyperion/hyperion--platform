import { z } from "zod";

export const localAuthLoginBodySchema = z
  .object({
    tenantId: z.string().min(1).max(120),
    loginRef: z.string().min(1).max(120),
    credential: z.string().min(8).max(200),
  })
  .strict();

export const authWhoamiQuerySchema = z
  .object({
    tenantId: z.string().min(1).max(120).optional(),
  })
  .strict();

export type LocalAuthLoginBody = z.infer<typeof localAuthLoginBodySchema>;
export type AuthWhoamiQuery = z.infer<typeof authWhoamiQuerySchema>;
