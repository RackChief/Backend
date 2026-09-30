import { asc, eq, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { ipAddresses, networkConnections, networkInterfaces, networkPorts } from "../../db/schema.js";
import type { InferInsertModel } from "drizzle-orm";
type NewInterface = InferInsertModel<typeof networkInterfaces>;
type NewPort = InferInsertModel<typeof networkPorts>;
type NewConnection = InferInsertModel<typeof networkConnections>;
type NewAddress = InferInsertModel<typeof ipAddresses>;
export const networkRepository = {
    interfaces(assetId?: string) { return db.select().from(networkInterfaces).where(assetId ? eq(networkInterfaces.assetId, assetId) : undefined).orderBy(asc(networkInterfaces.name)); },
    async interface(id: string) { return (await db.select().from(networkInterfaces).where(eq(networkInterfaces.id, id)).limit(1))[0]; },
    async createInterface(input: NewInterface) { return (await db.insert(networkInterfaces).values(input).returning())[0]; },
    async updateInterface(id: string, input: Partial<NewInterface>) { return (await db.update(networkInterfaces).set({ ...input, updatedAt: new Date() }).where(eq(networkInterfaces.id, id)).returning())[0]; },
    async deleteInterface(id: string) { return (await db.delete(networkInterfaces).where(eq(networkInterfaces.id, id)).returning()).length > 0; },
    ports(assetId?: string) { return db.select().from(networkPorts).where(assetId ? eq(networkPorts.assetId, assetId) : undefined).orderBy(asc(networkPorts.name)); },
    async port(id: string) { return (await db.select().from(networkPorts).where(eq(networkPorts.id, id)).limit(1))[0]; },
    async createPort(input: NewPort) { return (await db.insert(networkPorts).values(input).returning())[0]; },
    async updatePort(id: string, input: Partial<NewPort>) { return (await db.update(networkPorts).set({ ...input, updatedAt: new Date() }).where(eq(networkPorts.id, id)).returning())[0]; },
    async deletePort(id: string) { return (await db.delete(networkPorts).where(eq(networkPorts.id, id)).returning()).length > 0; },
    connections() { return db.select().from(networkConnections).orderBy(asc(networkConnections.createdAt)); },
    async connection(id: string) { return (await db.select().from(networkConnections).where(eq(networkConnections.id, id)).limit(1))[0]; },
    connectionsForPort(id: string) { return db.select().from(networkConnections).where(or(eq(networkConnections.portAId, id), eq(networkConnections.portBId, id))); },
    async createConnection(input: NewConnection) {
        return db.transaction(async tx => {
            await tx.execute(sql`select pg_advisory_xact_lock(418328)`);
            await assertPortsAvailable(tx, input.portAId, input.portBId);
            return (await tx.insert(networkConnections).values(input).returning())[0];
        });
    },
    async updateConnection(id: string, input: Partial<NewConnection>) {
        return db.transaction(async tx => {
            await tx.execute(sql`select pg_advisory_xact_lock(418328)`);
            const [old] = await tx.select().from(networkConnections).where(eq(networkConnections.id, id)).limit(1);
            if (!old) throw Object.assign(new Error("Network connection not found"), { statusCode: 404 });
            await assertPortsAvailable(tx, input.portAId ?? old.portAId, input.portBId ?? old.portBId, id);
            return (await tx.update(networkConnections).set({ ...input, updatedAt: new Date() }).where(eq(networkConnections.id, id)).returning())[0];
        });
    },
    async deleteConnection(id: string) { return (await db.delete(networkConnections).where(eq(networkConnections.id, id)).returning()).length > 0; },
    addresses(interfaceId?: string) { return db.select().from(ipAddresses).where(interfaceId ? eq(ipAddresses.networkInterfaceId, interfaceId) : undefined).orderBy(asc(ipAddresses.address)); },
    async address(id: string) { return (await db.select().from(ipAddresses).where(eq(ipAddresses.id, id)).limit(1))[0]; },
    async createAddress(input: NewAddress) { return (await db.insert(ipAddresses).values(input).returning())[0]; },
    async updateAddress(id: string, input: Partial<NewAddress>) { return (await db.update(ipAddresses).set({ ...input, updatedAt: new Date() }).where(eq(ipAddresses.id, id)).returning())[0]; },
    async deleteAddress(id: string) { return (await db.delete(ipAddresses).where(eq(ipAddresses.id, id)).returning()).length > 0; },
};

async function assertPortsAvailable(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], portAId: string, portBId: string, exceptId?: string) {
    const conflict = (message: string) => { throw Object.assign(new Error(message), { statusCode: 409 }); };
    if (portAId === portBId) conflict("Connection requires two different ports");
    const ports = await tx.select({ id: networkPorts.id }).from(networkPorts).where(or(eq(networkPorts.id, portAId), eq(networkPorts.id, portBId)));
    if (ports.length !== 2) throw Object.assign(new Error("Network port not found"), { statusCode: 404 });
    const rows = await tx.select({ id: networkConnections.id }).from(networkConnections).where(or(
        eq(networkConnections.portAId, portAId), eq(networkConnections.portBId, portAId),
        eq(networkConnections.portAId, portBId), eq(networkConnections.portBId, portBId),
    ));
    if (rows.some(row => row.id !== exceptId)) conflict("A port can have only one connection");
}
