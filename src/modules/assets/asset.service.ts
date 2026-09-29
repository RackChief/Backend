import type {
    NewAsset,
} from "../../db/schema.js";

import { assetRepository } from "./asset.repository.js";

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

    create(input: NewAsset) {
        return assetRepository.create(input);
    },

    async update(
        id: string,
        input: Partial<NewAsset>,
    ) {
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
    },
};
