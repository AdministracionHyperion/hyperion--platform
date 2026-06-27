import { z } from "zod";
import { featureFlagParamsSchema, tenantParamsSchema } from "./common.schemas";

export const coreContextParamsSchema = tenantParamsSchema;
export const coreFeatureFlagParamsSchema = featureFlagParamsSchema;

export type CoreContextParams = z.infer<typeof coreContextParamsSchema>;
export type CoreFeatureFlagParams = z.infer<typeof coreFeatureFlagParamsSchema>;
