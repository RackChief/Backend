import type { NewComponent } from "../../db/schema.js";
import { assetService } from "../assets/asset.service.js";
import { locationService } from "../locations/location.service.js";
import { componentRepository } from "./component.repository.js";
import type { z } from "../../openapi/zod.js";
import type { componentFilterSchema, CreateComponent, UpdateComponent } from "./component.schema.js";
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }); };
export const componentService = {
    types: () => componentRepository.types(),
    createType: (input: { name: string; slug: string; description?: string | null }) => componentRepository.createType(input),
    async type(id: string) { return await componentRepository.type(id) ?? fail("Component type not found", 404); },
    list: (filter: z.infer<typeof componentFilterSchema> = {}) => componentRepository.all(filter),
    async get(id: string) { return await componentRepository.get(id) ?? fail("Component not found", 404); },
    async validate(input: { componentTypeId?: string; assetId?: string | null; locationId?: string | null }) {
        if (input.componentTypeId) await this.type(input.componentTypeId);
        if (input.assetId) await assetService.get(input.assetId);
        if (input.locationId) await locationService.get(input.locationId);
    },
    async create(input: CreateComponent) { await this.validate(input); return componentRepository.create(this.values(input) as NewComponent); },
    async update(id: string, input: UpdateComponent) { await this.get(id); await this.validate(input); return componentRepository.update(id, this.values(input)); },
    values(input: CreateComponent | UpdateComponent): Partial<NewComponent> {
        const { installedAt, removedAt, ...rest } = input;
        return { ...rest, ...(installedAt !== undefined ? { installedAt: installedAt === null ? null : new Date(installedAt) } : {}), ...(removedAt !== undefined ? { removedAt: removedAt === null ? null : new Date(removedAt) } : {}) };
    },
    async delete(id: string) { await this.get(id); await componentRepository.delete(id); },
};
