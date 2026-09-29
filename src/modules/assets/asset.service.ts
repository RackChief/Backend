import type { NewAsset } from "../../db/schema.js";
import { assetRepository } from "./asset.repository.js";

export const assetService = {
    list() {
        return assetRepository.all();
    },

    async get(id: string) {
        const asset = await assetRepository.get(id);

        if (!asset) {
            const error = new Error("Asset not found");

            Object.assign(error, {
                statusCode: 404,
            });

            throw error;
        }

        return asset;
    },

    create(input: NewAsset) {
        return assetRepository.create(input);
    },
};
