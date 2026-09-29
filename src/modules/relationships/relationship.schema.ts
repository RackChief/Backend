import { z } from "../../openapi/zod.js";
export const relationshipTypeSchema = z.enum(["hosts", "runs_on", "depends_on", "backs_up_to", "managed_by", "powered_by", "connected_to", "other"]);
export const relationshipSchema = z.object({ id: z.uuid(), sourceAssetId: z.uuid(), targetAssetId: z.uuid(), relationshipType: relationshipTypeSchema, notes: z.string().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const createRelationshipSchema = z.object({ sourceAssetId: z.uuid(), targetAssetId: z.uuid(), relationshipType: relationshipTypeSchema, notes: z.string().nullable().optional() }).strict();
export const updateRelationshipSchema = createRelationshipSchema.partial();
