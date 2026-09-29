import { z } from "../../openapi/zod.js";

export const mcpSettingsSchema = z.object({ enabled: z.boolean() });
export const updateMcpSettingsSchema = mcpSettingsSchema.strict();
export const mcpTokenSchema = z.object({
    id: z.uuid(), name: z.string(), enabled: z.boolean(),
    lastUsedAt: z.iso.datetime().nullable(), expiresAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});
const futureDate = z.iso.datetime({ offset: true }).refine(
    (value) => new Date(value).getTime() > Date.now(), "Expiration must be in the future",
);
export const createMcpTokenSchema = z.object({
    name: z.string().trim().min(1), expiresAt: futureDate.optional(),
}).strict();
export const updateMcpTokenSchema = z.object({
    name: z.string().trim().min(1).optional(),
    enabled: z.boolean().optional(),
    expiresAt: futureDate.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");
export const createMcpTokenResponseSchema = mcpTokenSchema.extend({ token: z.string() });
export const mcpTokenIdParamsSchema = z.object({ id: z.uuid() });
export type CreateMcpToken = z.infer<typeof createMcpTokenSchema>;
export type UpdateMcpToken = z.infer<typeof updateMcpTokenSchema>;
