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
    async create(input: CreateComponent) {
        await this.validate(input);
        const type = await this.type(input.componentTypeId);
        return componentRepository.create({ ...this.values(input), name: input.name?.trim() || type.name } as NewComponent);
    },
    async update(id: string, input: UpdateComponent) {
        const current = await this.get(id);
        await this.validate(input);
        const values = this.values(input);
        if (input.name !== undefined) {
            const type = await this.type(input.componentTypeId ?? current.componentTypeId);
            values.name = input.name.trim() || type.name;
            if (input.componentTypeId && input.componentTypeId !== current.componentTypeId && input.name === current.name) {
                const previousType = await this.type(current.componentTypeId);
                if (current.name === previousType.name) values.name = type.name;
            }
        } else if (input.componentTypeId && input.componentTypeId !== current.componentTypeId) {
            const previousType = await this.type(current.componentTypeId);
            if (current.name === previousType.name) values.name = (await this.type(input.componentTypeId)).name;
        }
        return componentRepository.update(id, values);
    },
    values(input: CreateComponent | UpdateComponent): Partial<NewComponent> {
        const { installedAt, removedAt, ...rest } = input;
        return { ...rest, ...(installedAt !== undefined ? { installedAt: installedAt === null ? null : new Date(installedAt) } : {}), ...(removedAt !== undefined ? { removedAt: removedAt === null ? null : new Date(removedAt) } : {}) };
    },
    async delete(id: string) { await this.get(id); await componentRepository.delete(id); },
};
