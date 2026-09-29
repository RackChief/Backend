import { assetRelationships } from "../../db/schema.js";
import { assetService } from "../assets/asset.service.js";
import { relationshipRepository as repo } from "./relationship.repository.js";
type Input = typeof assetRelationships.$inferInsert;
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }); };
export const relationshipService = {
    async list(assetId?: string) { if (assetId) await assetService.get(assetId); return repo.all(assetId); },
    async get(id: string) { return await repo.get(id) ?? fail("Asset relationship not found", 404); },
    async validate(input: Input, exceptId?: string) {
        if (input.sourceAssetId === input.targetAssetId) fail("An asset cannot relate to itself", 409);
        await assetService.get(input.sourceAssetId); await assetService.get(input.targetAssetId);
        if ((await repo.all(input.sourceAssetId)).some(r => r.id !== exceptId && r.sourceAssetId === input.sourceAssetId && r.targetAssetId === input.targetAssetId && r.relationshipType === input.relationshipType)) fail("Asset relationship already exists", 409);
    },
    async create(input: Input) { await this.validate(input); return repo.create(input); },
    async update(id: string, input: Partial<Input>) { const old = await this.get(id); await this.validate({ ...old, ...input }, id); return repo.update(id, input); },
    async delete(id: string) { await this.get(id); await repo.delete(id); },
};
