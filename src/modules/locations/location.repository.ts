import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { locations, type NewLocation } from "../../db/schema.js";
export const locationRepository = {
    all: () => db.select().from(locations).orderBy(asc(locations.name)),
    async get(id: string) { return (await db.select().from(locations).where(eq(locations.id, id)).limit(1))[0]; },
    async create(input: NewLocation) { return (await db.insert(locations).values(input).returning())[0]; },
    async update(id: string, input: Partial<NewLocation>) { return (await db.update(locations).set({ ...input, updatedAt: new Date() }).where(eq(locations.id, id)).returning())[0]; },
    async delete(id: string) { return (await db.delete(locations).where(eq(locations.id, id)).returning()).length > 0; },
};
