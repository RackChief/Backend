import type { NewRack, NewRackPlacement } from "../../db/schema.js";
import { assetService } from "../assets/asset.service.js";
import { locationService } from "../locations/location.service.js";
import { rackRepository } from "./rack.repository.js";
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }); };
const occupiedUnits = (height: number) => Math.ceil(height);
export const rackService = {
    list: () => rackRepository.all(),
    async get(id: string) { const rack = await rackRepository.get(id) ?? fail("Rack not found", 404); return { ...rack, placements: await rackRepository.placements(id) }; },
    async create(input: NewRack) { if (input.locationId) await locationService.get(input.locationId); return rackRepository.create(input); },
    async update(id: string, input: Partial<NewRack>) {
        const rack = await this.get(id);
        if (input.locationId) await locationService.get(input.locationId);
        const first = input.startingUnit ?? rack.startingUnit;
        const last = first + (input.totalUnits ?? rack.totalUnits) - 1;
        if (rack.placements.some(p => p.startUnit < first || p.startUnit + occupiedUnits(p.asset.rackUnits) - 1 > last)) fail("Existing placement exceeds new rack capacity", 409);
        return rackRepository.update(id, input);
    },
    async delete(id: string) { const rack = await this.get(id); if (rack.placements.length) fail("Rack still has placements", 409); await rackRepository.delete(id); },
    async placements(id: string) { return (await this.get(id)).placements; },
    async placement(id: string, placementId: string) { const placement = await rackRepository.placement(placementId); if (!placement || placement.rackId !== id) fail("Rack placement not found", 404); return placement; },
    async validatePlacement(rackId: string, input: NewRackPlacement, exceptId?: string) {
        const rack = await this.get(rackId);
        const asset = await assetService.get(input.assetId);
        if (asset.rackUnits === 0) fail("Zero-unit assets cannot be placed in a rack", 409);
        if (input.heightUnits !== undefined && input.heightUnits !== asset.rackUnits) fail("Placement height must match the asset height", 400);
        const first = input.startUnit;
        const end = first + occupiedUnits(asset.rackUnits) - 1;
        if (first < rack.startingUnit || end >= rack.startingUnit + rack.totalUnits) fail("Placement exceeds rack capacity", 409);
        if (rack.placements.some(p => p.id !== exceptId && p.orientation === (input.orientation ?? "front") && p.startUnit <= end && p.startUnit + occupiedUnits(p.asset.rackUnits) - 1 >= first)) fail("Rack units overlap an existing placement", 409);
        if (rack.placements.some(p => p.id !== exceptId && p.assetId === input.assetId && p.orientation === (input.orientation ?? "front"))) fail("Asset already has a placement for this orientation", 409);
    },
    async place(rackId: string, input: Omit<NewRackPlacement, "rackId">) { const asset = await assetService.get(input.assetId); await this.validatePlacement(rackId, { ...input, rackId }); return rackRepository.createPlacement({ ...input, heightUnits: asset.rackUnits, rackId }); },
    async updatePlacement(rackId: string, placementId: string, input: Partial<NewRackPlacement>) {
        const current = await this.placement(rackId, placementId);
        const asset = await assetService.get(input.assetId ?? current.assetId);
        await this.validatePlacement(rackId, { ...current, ...input, heightUnits: input.heightUnits }, placementId);
        return rackRepository.updatePlacement(placementId, { ...input, heightUnits: asset.rackUnits });
    },
    async remove(rackId: string, placementId: string) { await this.placement(rackId, placementId); await rackRepository.deletePlacement(placementId); },
};
