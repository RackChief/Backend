import { z } from "../../openapi/zod.js";
export const locationSchema = z.object({ id: z.uuid(), name: z.string(), description: z.string().nullable(), parentId: z.uuid().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const createLocationSchema = z.object({ name: z.string().trim().min(1), description: z.string().nullable().optional(), parentId: z.uuid().nullable().optional() }).strict();
export const updateLocationSchema = createLocationSchema.partial();
