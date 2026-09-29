import type { NewLocation } from "../../db/schema.js";
import { locationRepository } from "./location.repository.js";
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }); };
export const locationService = {
    list: () => locationRepository.all(),
    async get(id: string) { return await locationRepository.get(id) ?? fail("Location not found", 404); },
    async create(input: NewLocation) {
        if (input.parentId) await this.get(input.parentId);
        return locationRepository.create(input);
    },
    async update(id: string, input: Partial<NewLocation>) {
        await this.get(id);
        if (input.parentId) {
            if (input.parentId === id) fail("Location cannot be its own parent", 409);
            let ancestor: string | null = input.parentId;
            const seen = new Set<string>();
            while (ancestor) {
                if (ancestor === id || seen.has(ancestor)) fail("Location hierarchy would contain a cycle", 409);
                seen.add(ancestor);
                ancestor = (await this.get(ancestor)).parentId;
            }
        }
        return locationRepository.update(id, input);
    },
    async delete(id: string) {
        await this.get(id);
        try { await locationRepository.delete(id); }
        catch (error) { if ((error as { code?: string }).code === "23503") fail("Location is still referenced", 409); throw error; }
    },
};
