import type {
    NewAsset,
} from "../../db/schema.js";

import { assetRepository } from "./asset.repository.js";
import { locationService } from "../locations/location.service.js";
import { deviceImageService } from "../device-images/device-image.service.js";

function notFound() {
    const error = new Error("Asset not found");

    Object.assign(error, {
        statusCode: 404,
    });

    return error;
}

export const assetService = {
    list() {
        return assetRepository.all();
    },

    async get(id: string) {
        const asset =
            await assetRepository.get(id);

        if (!asset) {
            throw notFound();
        }

        return asset;
    },

    async create(input: NewAsset) {
        if (input.locationId) await locationService.get(input.locationId);
        return assetRepository.create(input.status === "archived" ? { ...input, archivedAt: new Date() } : input);
    },

    async update(
        id: string,
        input: Partial<NewAsset>,
    ) {
        if (input.locationId) await locationService.get(input.locationId);
        if (input.status !== undefined && (await this.get(id)).archivedAt) {
            throw Object.assign(new Error("Restore the asset before changing its status"), { statusCode: 409 });
        }
        const asset =
            await assetRepository.update(
                id,
                input,
            );

        if (!asset) {
            throw notFound();
        }

        return asset;
    },

    async archive(id: string) {
        const asset =
            await assetRepository.archive(id);

        if (!asset) {
            throw notFound();
        }

        return asset;
    },

    async restore(id: string) {
        const asset =
            await assetRepository.restore(id);

        if (!asset) {
            throw notFound();
        }

        return asset;
    },

    async delete(id: string) {
        const asset =
            await assetRepository.get(id);

        if (!asset) {
            throw notFound();
        }

        if (!asset.archivedAt) {
            const error = new Error(
                "Asset must be archived before permanent deletion",
            );

            Object.assign(error, {
                statusCode: 409,
            });

            throw error;
        }

        if (!await assetRepository.delete(id)) {
            throw Object.assign(new Error("Asset must be archived before permanent deletion"), { statusCode: 409 });
        }
        const cleanup = await Promise.allSettled([
            deviceImageService.deleteCustom(id, "front"),
            deviceImageService.deleteCustom(id, "rear"),
        ]);
        for (const result of cleanup) {
            if (result.status === "rejected") console.warn("Could not remove a deleted asset's custom image", result.reason);
        }
    },
};
