import { z } from "../../openapi/zod.js";
export const rackOrientationSchema = z.enum(["front", "rear"]);
export const rackSchema = z.object({ id: z.uuid(), name: z.string(), description: z.string().nullable(), totalUnits: z.number().int(), startingUnit: z.number().int(), locationId: z.uuid().nullable(), notes: z.string().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const placementSchema = z.object({ id: z.uuid(), rackId: z.uuid(), assetId: z.uuid(), startUnit: z.number().int(), heightUnits: z.number().int(), orientation: rackOrientationSchema, notes: z.string().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), asset: z.object({ id: z.uuid(), name: z.string(), status: z.string(), assetTypeId: z.uuid() }) });
export const rackDetailSchema = rackSchema.extend({ placements: z.array(placementSchema) });
export const createRackSchema = z.object({ name: z.string().trim().min(1), description: z.string().nullable().optional(), totalUnits: z.number().int().min(1).max(100), startingUnit: z.number().int().min(1).optional(), locationId: z.uuid().nullable().optional(), notes: z.string().nullable().optional() }).strict();
export const updateRackSchema = createRackSchema.partial();
export const createPlacementSchema = z.object({ assetId: z.uuid(), startUnit: z.number().int().min(1), heightUnits: z.number().int().min(1).optional(), orientation: rackOrientationSchema.optional(), notes: z.string().nullable().optional() }).strict();
export const updatePlacementSchema = createPlacementSchema.partial();
