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

    assetTypeId: z.uuid(),

    name: z.string(),
    status: assetStatusSchema,

    hostname: z.string().nullable(),
    ipAddress: z.string().nullable(),

    manufacturer: z.string().nullable(),
    model: z.string().nullable(),
    serialNumber: z.string().nullable(),

    notes: z.string().nullable(),

    archivedAt: z.iso.datetime().nullable(),

    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export const createAssetSchema = z.object({
    name: z.string().min(1),

    assetTypeId: z.uuid(),

    status: assetStatusSchema.optional(),

    hostname: z.string().optional(),
    ipAddress: z.string().optional(),

    manufacturer: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),

    notes: z.string().optional(),
});
