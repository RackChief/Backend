import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { assets, racks, rackPlacements, type NewRack, type NewRackPlacement } from "../../db/schema.js";
export const rackRepository = {
    all: () => db.select().from(racks).orderBy(asc(racks.name)),
    async get(id: string) { return (await db.select().from(racks).where(eq(racks.id, id)).limit(1))[0]; },
    async create(input: NewRack) { return (await db.insert(racks).values(input).returning())[0]; },
    async update(id: string, input: Partial<NewRack>) { return (await db.update(racks).set({ ...input, updatedAt: new Date() }).where(eq(racks.id, id)).returning())[0]; },
    async delete(id: string) { return (await db.delete(racks).where(eq(racks.id, id)).returning()).length > 0; },
    async placements(rackId: string) {
        const rows = await db.select({ placement: rackPlacements, asset: { id: assets.id, name: assets.name, status: assets.status, assetTypeId: assets.assetTypeId } }).from(rackPlacements).innerJoin(assets, eq(rackPlacements.assetId, assets.id)).where(eq(rackPlacements.rackId, rackId)).orderBy(asc(rackPlacements.startUnit));
        return rows.map(row => ({ ...row.placement, asset: row.asset }));
    },
    async placement(id: string) { return (await db.select().from(rackPlacements).where(eq(rackPlacements.id, id)).limit(1))[0]; },
    async createPlacement(input: NewRackPlacement) { return (await db.insert(rackPlacements).values(input).returning())[0]; },
    async updatePlacement(id: string, input: Partial<NewRackPlacement>) { return (await db.update(rackPlacements).set({ ...input, updatedAt: new Date() }).where(eq(rackPlacements.id, id)).returning())[0]; },
    async deletePlacement(id: string) { return (await db.delete(rackPlacements).where(eq(rackPlacements.id, id)).returning()).length > 0; },
};
