import { z } from "../../openapi/zod.js";

export const assetStatusSchema = z.enum([
    "planned",
    "active",
    "offline",
    "retired",
    "archived",
]);

export const assetSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    status: assetStatusSchema,
    hostname: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export const createAssetSchema = z.object({
    name: z.string().min(1),
    hostname: z.string().optional(),
    notes: z.string().optional(),
});
