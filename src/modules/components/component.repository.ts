import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { componentTypes, components, type NewComponent } from "../../db/schema.js";
import type { z } from "../../openapi/zod.js";
import type { componentFilterSchema } from "./component.schema.js";
type Filter = z.infer<typeof componentFilterSchema>;
export const componentRepository = {
    types: () => db.select().from(componentTypes).orderBy(asc(componentTypes.name)),
    async createType(input: typeof componentTypes.$inferInsert) { return (await db.insert(componentTypes).values(input).returning())[0]; },
    async type(id: string) { return (await db.select().from(componentTypes).where(eq(componentTypes.id, id)).limit(1))[0]; },
    all(filter: Filter = {}) { return db.select().from(components).where(and(filter.assetId ? eq(components.assetId, filter.assetId) : undefined, filter.componentTypeId ? eq(components.componentTypeId, filter.componentTypeId) : undefined, filter.status ? eq(components.status, filter.status) : undefined, filter.unassigned === "true" ? isNull(components.assetId) : undefined)).orderBy(asc(components.name)); },
    async get(id: string) { return (await db.select().from(components).where(eq(components.id, id)).limit(1))[0]; },
    async create(input: NewComponent) { return (await db.insert(components).values(input).returning())[0]; },
    async update(id: string, input: Partial<NewComponent>) { return (await db.update(components).set({ ...input, updatedAt: new Date() }).where(eq(components.id, id)).returning())[0]; },
    async delete(id: string) { return (await db.delete(components).where(eq(components.id, id)).returning()).length > 0; },
};
