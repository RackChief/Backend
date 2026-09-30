import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { assets, racks, rackPlacements, type NewRack, type NewRackPlacement } from "../../db/schema.js";
export const rackRepository = {
    all: () => db.select().from(racks).orderBy(asc(racks.name)),
    async get(id: string) { return (await db.select().from(racks).where(eq(racks.id, id)).limit(1))[0]; },
    async create(input: NewRack) { return (await db.insert(racks).values(input).returning())[0]; },
    async update(id: string, input: Partial<NewRack>) {
        return db.transaction(async tx => {
            await tx.execute(sql`select pg_advisory_xact_lock(418329)`);
            const [rack] = await tx.select().from(racks).where(eq(racks.id, id));
            if (!rack) return undefined;
            const first = input.startingUnit ?? rack.startingUnit;
            const last = first + (input.totalUnits ?? rack.totalUnits) - 1;
            const placements = await tx.select({ placement: rackPlacements, height: assets.rackUnits }).from(rackPlacements).innerJoin(assets, eq(rackPlacements.assetId, assets.id)).where(eq(rackPlacements.rackId, id));
            if (placements.some(({ placement, height }) => placement.startUnit < first || placement.startUnit + Math.ceil(height) - 1 > last)) conflict("Existing placement exceeds new rack capacity");
            return (await tx.update(racks).set({ ...input, updatedAt: new Date() }).where(eq(racks.id, id)).returning())[0];
        });
    },
    async delete(id: string) { return (await db.delete(racks).where(eq(racks.id, id)).returning()).length > 0; },
    async placements(rackId: string) {
        const rows = await db.select({ placement: rackPlacements, asset: { id: assets.id, name: assets.name, status: assets.status, assetTypeId: assets.assetTypeId, rackUnits: assets.rackUnits } }).from(rackPlacements).innerJoin(assets, eq(rackPlacements.assetId, assets.id)).where(eq(rackPlacements.rackId, rackId)).orderBy(asc(rackPlacements.startUnit));
        return rows.map(row => ({ ...row.placement, asset: row.asset }));
    },
    async placement(id: string) { return (await db.select().from(rackPlacements).where(eq(rackPlacements.id, id)).limit(1))[0]; },
    async createPlacement(input: NewRackPlacement) {
        return db.transaction(async tx => {
            await tx.execute(sql`select pg_advisory_xact_lock(418329)`);
            const height = await assertRackFit(tx, input.rackId, input.assetId, input.startUnit, input.orientation ?? "front");
            return (await tx.insert(rackPlacements).values({ ...input, heightUnits: height }).returning())[0];
        });
    },
    async updatePlacement(id: string, input: Partial<NewRackPlacement>) {
        return db.transaction(async tx => {
            await tx.execute(sql`select pg_advisory_xact_lock(418329)`);
            const [old] = await tx.select().from(rackPlacements).where(eq(rackPlacements.id, id));
            if (!old) throw Object.assign(new Error("Rack placement not found"), { statusCode: 404 });
            const height = await assertRackFit(tx, old.rackId, input.assetId ?? old.assetId, input.startUnit ?? old.startUnit, input.orientation ?? old.orientation, id);
            return (await tx.update(rackPlacements).set({ ...input, heightUnits: height, rackId: old.rackId, updatedAt: new Date() }).where(eq(rackPlacements.id, id)).returning())[0];
        });
    },
    async deletePlacement(id: string) { return (await db.delete(rackPlacements).where(eq(rackPlacements.id, id)).returning()).length > 0; },
};

export type RackTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function lockRackWrites(tx: RackTransaction) { await tx.execute(sql`select pg_advisory_xact_lock(418329)`); }
function conflict(message: string): never { throw Object.assign(new Error(message), { statusCode: 409 }); }
export async function assertRackFit(tx: RackTransaction, rackId: string, assetId: string, startUnit: number, orientation: "front" | "rear", exceptId?: string, heightOverride?: number): Promise<number> {
    const [rack] = await tx.select().from(racks).where(eq(racks.id, rackId));
    const [asset] = await tx.select({ rackUnits: assets.rackUnits }).from(assets).where(eq(assets.id, assetId));
    if (!rack || !asset) conflict("Rack or asset no longer exists");
    const height = heightOverride ?? asset.rackUnits;
    if (height === 0) conflict("Zero-unit assets cannot be placed in a rack");
    if (startUnit < rack.startingUnit || startUnit + Math.ceil(height) > rack.startingUnit + rack.totalUnits) conflict("Placement exceeds rack capacity");
    const rows = await tx.select({ placement: rackPlacements, height: assets.rackUnits }).from(rackPlacements).innerJoin(assets, eq(rackPlacements.assetId, assets.id)).where(eq(rackPlacements.rackId, rackId));
    for (const { placement, height: otherHeight } of rows) {
        if (placement.id === exceptId) continue;
        if (placement.assetId === assetId && placement.orientation === orientation) conflict("Asset already has a placement for this orientation");
        if (placement.orientation === orientation && placement.startUnit < startUnit + Math.ceil(height) && startUnit < placement.startUnit + Math.ceil(otherHeight)) conflict("Rack units overlap an existing placement");
    }
    return height;
}
