import type { InferInsertModel } from "drizzle-orm";
import { ipAddresses, networkConnections, networkInterfaces, networkPorts } from "../../db/schema.js";
import { assetService } from "../assets/asset.service.js";
import { networkRepository as repo } from "./network.repository.js";
type InterfaceInput = InferInsertModel<typeof networkInterfaces>;
type PortInput = InferInsertModel<typeof networkPorts>;
type ConnectionInput = InferInsertModel<typeof networkConnections>;
type AddressInput = InferInsertModel<typeof ipAddresses>;
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }); };
export const networkService = {
    async interfaces(assetId?: string) { if (assetId) await assetService.get(assetId); return repo.interfaces(assetId); },
    async interface(id: string) { return await repo.interface(id) ?? fail("Network interface not found", 404); },
    async createInterface(assetId: string, input: Omit<InterfaceInput, "assetId">) { await assetService.get(assetId); return repo.createInterface({ ...input, assetId }); },
    async updateInterface(id: string, input: Partial<InterfaceInput>) { await this.interface(id); return repo.updateInterface(id, input); },
    async deleteInterface(id: string) { await this.interface(id); await repo.deleteInterface(id); },
    async ports(assetId?: string) { if (assetId) await assetService.get(assetId); return repo.ports(assetId); },
    async port(id: string) { return await repo.port(id) ?? fail("Network port not found", 404); },
    async validatePort(assetId: string, input: Partial<PortInput>) {
        if (input.interfaceId) { const iface = await this.interface(input.interfaceId); if (iface.assetId !== assetId) fail("Port interface belongs to a different asset", 409); }
        if (input.poeEnabled && !input.poeCapable) fail("PoE cannot be enabled on a port that is not PoE capable", 409);
    },
    async createPort(assetId: string, input: Omit<PortInput, "assetId">) { await assetService.get(assetId); await this.validatePort(assetId, input); return repo.createPort({ ...input, assetId }); },
    async updatePort(id: string, input: Partial<PortInput>) { const port = await this.port(id); await this.validatePort(port.assetId, { ...port, ...input }); return repo.updatePort(id, input); },
    async deletePort(id: string) { await this.port(id); await repo.deletePort(id); },
    async connections(assetId?: string, portId?: string) {
        const rows = await repo.connections();
        if (portId) { await this.port(portId); return rows.filter(c => c.portAId === portId || c.portBId === portId); }
        if (assetId) { await assetService.get(assetId); const ids = new Set((await repo.ports(assetId)).map(p => p.id)); return rows.filter(c => ids.has(c.portAId) || ids.has(c.portBId)); }
        return rows;
    },
    async connection(id: string) { return await repo.connection(id) ?? fail("Network connection not found", 404); },
    async validateConnection(input: ConnectionInput, exceptId?: string) {
        if (input.portAId === input.portBId) fail("Connection requires two different ports", 409);
        await this.port(input.portAId); await this.port(input.portBId);
        for (const id of [input.portAId, input.portBId]) {
            if ((await repo.connectionsForPort(id)).some(c => c.id !== exceptId)) fail("A port can have only one connection", 409);
        }
    },
    async connect(input: ConnectionInput) { await this.validateConnection(input); return repo.createConnection(input); },
    async updateConnection(id: string, input: Partial<ConnectionInput>) { const old = await this.connection(id); await this.validateConnection({ ...old, ...input }, id); return repo.updateConnection(id, input); },
    async disconnect(id: string) { await this.connection(id); await repo.deleteConnection(id); },
    async addresses(interfaceId?: string) { if (interfaceId) await this.interface(interfaceId); return repo.addresses(interfaceId); },
    async address(id: string) { return await repo.address(id) ?? fail("IP address not found", 404); },
    async validatePrimary(interfaceId: string, isPrimary?: boolean, exceptId?: string) { if (isPrimary && (await repo.addresses(interfaceId)).some(a => a.isPrimary && a.id !== exceptId)) fail("Interface already has a primary IP address", 409); },
    async addAddress(interfaceId: string, input: Omit<AddressInput, "networkInterfaceId">) { await this.interface(interfaceId); await this.validatePrimary(interfaceId, input.isPrimary); return repo.createAddress({ ...input, networkInterfaceId: interfaceId }); },
    async updateAddress(id: string, input: Partial<AddressInput>) { const old = await this.address(id); await this.validatePrimary(old.networkInterfaceId, input.isPrimary, id); return repo.updateAddress(id, input); },
    async deleteAddress(id: string) { await this.address(id); await repo.deleteAddress(id); },
};
