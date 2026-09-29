import { asc, eq, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { assetRelationships } from "../../db/schema.js";
type NewRelationship = typeof assetRelationships.$inferInsert;
export const relationshipRepository = {
    all(assetId?: string) { return db.select().from(assetRelationships).where(assetId ? or(eq(assetRelationships.sourceAssetId, assetId), eq(assetRelationships.targetAssetId, assetId)) : undefined).orderBy(asc(assetRelationships.createdAt)); },
    async get(id: string) { return (await db.select().from(assetRelationships).where(eq(assetRelationships.id, id)).limit(1))[0]; },
    async create(input: NewRelationship) { return (await db.insert(assetRelationships).values(input).returning())[0]; },
    async update(id: string, input: Partial<NewRelationship>) { return (await db.update(assetRelationships).set({ ...input, updatedAt: new Date() }).where(eq(assetRelationships.id, id)).returning())[0]; },
    async delete(id: string) { return (await db.delete(assetRelationships).where(eq(assetRelationships.id, id)).returning()).length > 0; },
};
