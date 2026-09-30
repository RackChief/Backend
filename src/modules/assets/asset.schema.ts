import { z } from "../../openapi/zod.js";
import { ipSchema } from "../networking/network.schema.js";

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
    rackUnits: z.number().min(0).max(100).refine(value => value % 0.5 === 0),
    deviceTypeSource: z.string().nullable(),
    deviceTypePath: z.string().nullable(),
    deviceTypeData: z.record(z.string(), z.unknown()).nullable(),
    catalogProvider: z.string().nullable(),
    catalogDeviceId: z.string().nullable(),
    catalogRevision: z.string().nullable(),

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
    ipAddress: ipSchema.optional(),

    manufacturer: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    rackUnits: z.number().min(0).max(100).refine(value => value % 0.5 === 0).optional(),
    deviceTypeSource: z.string().optional(),
    deviceTypePath: z.string().optional(),
    deviceTypeData: z.record(z.string(), z.unknown()).optional(),
    catalogProvider: z.string().optional(),
    catalogDeviceId: z.string().optional(),
    catalogRevision: z.string().optional(),

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
    ipAddress: ipSchema.nullable().optional(),

    manufacturer: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    serialNumber: z.string().nullable().optional(),
    rackUnits: z.number().min(0).max(100).refine(value => value % 0.5 === 0).optional(),
    deviceTypeSource: z.string().nullable().optional(),
    deviceTypePath: z.string().nullable().optional(),
    deviceTypeData: z.record(z.string(), z.unknown()).nullable().optional(),
    catalogProvider: z.string().nullable().optional(),
    catalogDeviceId: z.string().nullable().optional(),
    catalogRevision: z.string().nullable().optional(),

    notes: z.string().nullable().optional(),
});
