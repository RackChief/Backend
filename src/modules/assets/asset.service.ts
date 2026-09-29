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
        return assetRepository.create(input);
    },

    async update(
        id: string,
        input: Partial<NewAsset>,
    ) {
        if (input.locationId) await locationService.get(input.locationId);
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

        await assetRepository.delete(id);
        const cleanup = await Promise.allSettled([
            deviceImageService.deleteCustom(id, "front"),
            deviceImageService.deleteCustom(id, "rear"),
        ]);
        for (const result of cleanup) {
            if (result.status === "rejected") console.warn("Could not remove a deleted asset's custom image", result.reason);
        }
    },
};
