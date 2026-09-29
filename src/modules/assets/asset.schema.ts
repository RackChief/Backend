import { z } from "../../openapi/zod.js";

export const assetStatusSchema = z.enum([
    "planned",
    "active",
    "offline",
    "retired",
    "archived",
]);

export const assetTypeSummarySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
});

export const assetSchema = z.object({
    id: z.uuid(),

    assetTypeId: z.uuid(),

    assetType: assetTypeSummarySchema,

    name: z.string(),
    status: assetStatusSchema,

    locationId: z.uuid().nullable(),
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

    locationId: z.uuid().nullable().optional(),
    hostname: z.string().optional(),
    ipAddress: z.string().optional(),

    manufacturer: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),

    notes: z.string().optional(),
});

export const updateAssetSchema = z.object({
    name: z.string().min(1).optional(),

    assetTypeId: z.uuid().optional(),

    status: assetStatusSchema
        .exclude(["archived"])
        .optional(),

    locationId: z.uuid().nullable().optional(),
    hostname: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),

    manufacturer: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    serialNumber: z.string().nullable().optional(),

    notes: z.string().nullable().optional(),
});
